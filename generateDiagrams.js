const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { getFilesFromDir, ensureDirectoryExists, generateHTMLContent } = require('./asset/utils');

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

// Function to read the diagram file and generate SVG and PNG
async function generateDiagram(filePath) {
    const diagramCode = await fs.readFile(filePath, 'utf8');
    const diagramName = path.basename(filePath, path.extname(filePath));

    const diagramTransformerScript = await fs.readFile(transformerScriptPath, 'utf8');
    const diagramStyles = await fs.readFile(cssFilePath, 'utf8'); 

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const content = generateHTMLContent(diagramCode, diagramTransformerScript, diagramStyles);

    await page.setContent(content);
    
    // Wait for the SVG diagram to be generated
    await page.waitForSelector('svg');

    // Save the image as SVG
    const svgContent = await page.evaluate(() => document.querySelector('svg').outerHTML);
    const svgOutputPath = path.join(outputSvgDir, `${diagramName}.svg`);
    await fs.outputFile(svgOutputPath, svgContent);
    console.log(`SVG saved: ${svgOutputPath}`);

    // Save the image as PNG
    const svgElement = await page.$('svg');
    
    // Wait a bit to ensure the content is fully rendered
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500))); // Wait 500ms
    
    const pngOutputPath = path.join(outputPngDir, `${diagramName}.png`);
    await svgElement.screenshot({ path: pngOutputPath });
    console.log(`PNG saved: ${pngOutputPath}`);

    await browser.close();
}

// Main function to generate all diagrams
async function generateAllDiagrams() {
    ensureDirectoryExists(outputSvgDir);
    ensureDirectoryExists(outputPngDir);

    const diagramFiles = getFilesFromDir(srcDir, '.txt');
    const timestamps = loadTimestamps();
    let timestampsModified = false;

    for (const file of diagramFiles) {
        const filePath = path.join(srcDir, file);
        const stat = fs.statSync(filePath);
        const lastModifiedTime = stat.mtimeMs;
        
        // Check if the file has been modified since the last time it was processed
        if (timestamps[filePath] !== lastModifiedTime) {
            console.log(`Generating diagram for: ${file}`);
            await generateDiagram(filePath);
            // Update the timestamp for this file
            timestamps[filePath] = lastModifiedTime;
            timestampsModified = true;
        } else {
            console.log(`No changes detected for: ${file}, skipping generation.`);
        }
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