const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { getFilesFromDir, ensureDirectoryExists, generateHTMLContent, buildStandaloneSvg } = require('./asset/utils');

const transformerScriptPath = path.join(__dirname, 'asset', 'diagram-transformer.js');
const cssFilePath = path.join(__dirname, 'asset', 'diagram-style.css');
const srcDir = path.join(__dirname, 'src');
const outputSvgDir = path.join(__dirname, 'img', 'svg');
const outputPngDir = path.join(__dirname, 'img', 'png');
const timestampFilePath = path.join(__dirname, 'timestamps.json');

// Function to load the timestamps from the JSON file
function loadTimestamps() {
    if (fs.existsSync(timestampFilePath)) {
        return fs.readJsonSync(timestampFilePath);
    }
    return {};
}

// Function to save the timestamps to the JSON file
function saveTimestamps(timestamps) {
    fs.writeJsonSync(timestampFilePath, timestamps, { spaces: 2 });
}

// Launch options are kept in one place so the main run and the crash recovery
// below always use the same configuration.
function launchBrowser() {
    return puppeteer.launch({ protocolTimeout: 60000 });
}

// Close a browser that may already be dead and start a clean one.
async function restartBrowser(browser) {
    try {
        await browser.close();
    } catch (err) {
        // The process is already gone; nothing to clean up.
    }
    return launchBrowser();
}

// Function to read the diagram file and generate SVG and PNG.
// The browser and the asset files are passed in so that they are loaded once for
// the whole run instead of once per diagram.
async function generateDiagram(filePath, browser, assets) {
    const diagramCode = await fs.readFile(filePath, 'utf8');
    const diagramName = path.basename(filePath, path.extname(filePath));

    const { diagramTransformerScript, diagramStyles } = assets;

    const page = await browser.newPage();

    const content = generateHTMLContent(diagramCode, diagramTransformerScript, diagramStyles);

    await page.setContent(content);
    
    // Wait for the SVG diagram to be generated
    await page.waitForSelector('svg');

    // Save the image as SVG.
    // XMLSerializer is used instead of outerHTML so the markup is well-formed XML
    // (proper namespaces and self-closing elements) rather than HTML serialization.
    const svgMarkup = await page.evaluate(
        () => new XMLSerializer().serializeToString(document.querySelector('svg'))
    );
    const svgContent = buildStandaloneSvg(svgMarkup, diagramStyles);
    const svgOutputPath = path.join(outputSvgDir, `${diagramName}.svg`);
    await fs.outputFile(svgOutputPath, svgContent);
    console.log(`SVG saved: ${svgOutputPath}`);

    // Save the image as PNG
    const svgElement = await page.$('svg');
    
    // Wait a bit to ensure the content is fully rendered.
    // The wait happens in Node, not inside the page: a long-running evaluate() can
    // hit Puppeteer's protocol timeout and abort the whole run.
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pngOutputPath = path.join(outputPngDir, `${diagramName}.png`);
    await svgElement.screenshot({ path: pngOutputPath });
    console.log(`PNG saved: ${pngOutputPath}`);

    await page.close();
}

// Main function to generate all diagrams
async function generateAllDiagrams() {
    ensureDirectoryExists(outputSvgDir);
    ensureDirectoryExists(outputPngDir);

    const diagramFiles = getFilesFromDir(srcDir, '.txt');
    const timestamps = loadTimestamps();
    let timestampsModified = false;

    const assets = {
        diagramTransformerScript: await fs.readFile(transformerScriptPath, 'utf8'),
        diagramStyles: await fs.readFile(cssFilePath, 'utf8')
    };

    // One browser is shared by the whole run, but a renderer crash on a single
    // diagram must not take the rest of the batch down with it, so the browser is
    // replaced and the diagram retried once before giving up on it.
    let browser = await launchBrowser();
    try {
        for (const file of diagramFiles) {
            const filePath = path.join(srcDir, file);
            const stat = fs.statSync(filePath);
            const lastModifiedTime = stat.mtimeMs;

            // Check if the file has been modified since the last time it was processed
            if (timestamps[filePath] !== lastModifiedTime) {
                console.log(`Generating diagram for: ${file}`);
                let generated = false;
                try {
                    await generateDiagram(filePath, browser, assets);
                    generated = true;
                } catch (err) {
                    console.error(`Failed to generate ${file}: ${err.message} - retrying with a fresh browser.`);
                    browser = await restartBrowser(browser);
                    try {
                        await generateDiagram(filePath, browser, assets);
                        generated = true;
                    } catch (retryErr) {
                        // Give up on this one. Its timestamp is left untouched, so the
                        // next run will try again instead of silently skipping it.
                        console.error(`Skipped ${file}: ${retryErr.message}`);
                        browser = await restartBrowser(browser);
                    }
                }
                if (generated) {
                    // Update the timestamp for this file
                    timestamps[filePath] = lastModifiedTime;
                    timestampsModified = true;
                }
            } else {
                console.log(`No changes detected for: ${file}, skipping generation.`);
            }
        }
    } finally {
        await browser.close().catch(() => {});
    }

    // Save timestamps if they were modified
    if (timestampsModified) {
        saveTimestamps(timestamps);
    }
}

generateAllDiagrams().then(() => {
    console.log('All diagrams have been generated.');
}).catch(err => {
    console.error('Error generating diagrams:', err);
});