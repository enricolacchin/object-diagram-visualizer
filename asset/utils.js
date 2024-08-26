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
    generateHTMLContent
};