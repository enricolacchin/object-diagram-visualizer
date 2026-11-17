const fs = require('fs-extra');
const path = require('path');

// Function to ensure a directory exists, if not, creates it
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
}

// Function to read all files from a directory with a specific extension
function getFilesFromDir(dir, ext) {
    return fs.readdirSync(dir).filter(file => path.extname(file).toLowerCase() === ext);
}

// Function to turn the in-page <svg> markup into a self-contained .svg file.
// The diagram styles normally live in the <head> of the Puppeteer page, so an
// exported SVG would render with the browser defaults (black fills, no strokes).
// Here the stylesheet is inlined into the SVG itself and an opaque background is
// added, so the file looks the same as the PNG in any viewer.
function buildStandaloneSvg(svgMarkup, diagramStyles) {
    let svg = svgMarkup.trim();

    // Make sure the root element carries the SVG namespace and the .diagram class
    // the stylesheet is scoped to (older diagrams generated before this fix).
    const openTagMatch = svg.match(/^<svg\b[^>]*>/i);
    if (!openTagMatch) {
        throw new Error('No <svg> root element found in the generated markup.');
    }
    let openTag = openTagMatch[0];
    const patchedOpenTag = (function (tag) {
        let t = tag;
        if (!/\bxmlns\s*=/i.test(t)) {
            t = t.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!/\bxmlns:xlink\s*=/i.test(t)) {
            t = t.replace(/^<svg/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        if (!/\bclass\s*=/i.test(t)) {
            t = t.replace(/\s*(\/?)>$/, ' class="diagram"$1>');
        } else if (!/\bclass\s*=\s*"[^"]*\bdiagram\b/i.test(t)) {
            t = t.replace(/\bclass\s*=\s*"/i, 'class="diagram ');
        }
        return t;
    })(openTag);
    svg = patchedOpenTag + svg.slice(openTag.length);

    // Width/height of the viewport, used for the background rectangle.
    const widthMatch = svg.match(/\bwidth\s*=\s*"([^"]+)"/i);
    const heightMatch = svg.match(/\bheight\s*=\s*"([^"]+)"/i);
    const width = widthMatch ? widthMatch[1] : '100%';
    const height = heightMatch ? heightMatch[1] : '100%';

    // CSS goes in a CDATA block so that characters such as > or & in future
    // selectors cannot break XML parsing.
    const styleBlock =
        '<style type="text/css"><![CDATA[\n' +
        diagramStyles.trim() +
        '\n]]></style>';

    // Inline style attribute, so it wins over the `.diagram rect` rule.
    const background =
        '<rect x="0" y="0" width="' + width + '" height="' + height + '" ' +
        'style="fill:#ffffff;stroke:none" shape-rendering="crispEdges"/>';

    svg = svg.replace(patchedOpenTag, patchedOpenTag + styleBlock + background);

    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svg + '\n';
}

// Function to generate HTML content from a diagram code
function generateHTMLContent(diagramCode, diagramTransformerScript, diagramStyles) {
    return `
    <html lang="en">
    <head>
        <style>
            ${diagramStyles}
        </style>
        <title>Object Diagram Visualizer</title>
    </head>
    <body>
        <div class="diagram">
            <pre>${diagramCode}</pre>
        </div>
        <script>
            ${diagramTransformerScript}
            window.diagramTransformer = DiagramTransformer;
            window.addEventListener('DOMContentLoaded', function() {
                DiagramTransformer.transformAll(document, 'diagram');
            });
        </script>
    </body>
    </html>
    `;
}

module.exports = {
    ensureDirectoryExists,
    getFilesFromDir,
    generateHTMLContent,
    buildStandaloneSvg
};