# Object Diagram Visualizer

## Project Overview

**Object Diagram Visualizer** is a tool designed to automatically generate visual diagrams from text-based diagram codes. It processes simple textual representations of diagrams and converts them into SVG and PNG image formats. This project aims to simplify the creation of technical and educational diagrams by automating the transformation process, allowing users to focus on the content rather than the technical details of diagram creation.

## Features

- **Automated Diagram Generation**: Converts text-based diagram codes into SVG and PNG images.
- **Textual Diagram Representation**: Users can define diagrams using a simple, easy-to-understand syntax.
- **Support for Multiple Diagram Types**: Includes various shapes such as rectangles, circles, arrays, and more, with customizable labels and styles.
- **Styling Customization**: Uses a CSS file to define the visual appearance of the diagrams, allowing for easy theme adjustments.
- **Batch Processing**: Automatically processes all diagram files in a specified directory, only updating images if the source files have changed.
- **Timestamp Tracking**: Keeps track of the last modification time of diagram files to avoid unnecessary reprocessing.
- **SVG and PNG Output**: Generates both scalable vector graphics (SVG) and rasterized PNG images for versatile use.

## Installation

### Prerequisites

- **Node.js**: Ensure that Node.js is installed on your system. You can download it from [Node.js official website](https://nodejs.org/).
- **NPM**: Node Package Manager is typically included with Node.js.

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/enricolacchin/object-diagram-visualizer.git
   cd object-diagram-visualizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup directories**: Ensure that the required directories for input and output are present.
   ```bash
   mkdir -p src img/svg img/png
   ```

4. **Add your diagram files**: Place your `.txt` files containing the diagram codes in the `src` directory.

## Usage

### Generate Diagrams

To generate diagrams, run the following command:

```bash
node generateDiagrams.js
```

This script will process all `.txt` files in the `src` directory, generate SVG and PNG images, and save them in the `img/svg` and `img/png` directories, respectively.

### Example Diagram Code

```txt
ref(50, 50, "A");
obj(100, 100, 100, 50, "Object", "Content");
arrow(200, 200, 50, 50, 45);
```

This example creates a diagram with a reference point, an object, and an arrow.

## Code Structure

### Key Directories and Files

- **`generateDiagrams.js`**: Main script for generating diagrams from text files.
- **`utils.js`**: Utility functions for file operations and content generation.
- **`diagram-transformer.js`**: Core logic for transforming diagram code into SVG elements.
- **`diagram-style.css`**: CSS file defining the visual style of the diagrams.

### Interaction of Components

1. **generateDiagrams.js** loads and processes each diagram file, utilizing utility functions from `utils.js`.
2. **diagram-transformer.js** handles the conversion of textual diagram descriptions into SVG elements.
3. **diagram-style.css** applies styling to the generated diagrams, ensuring they follow a consistent visual theme.

### Core Modules

- **`generateHTMLContent`**: Combines diagram code, transformer script, and CSS into a single HTML document.
- **`transform` and `transformAll`**: Functions in `diagram-transformer.js` that parse and convert diagram codes to SVG.

## Contribution Guidelines

We welcome contributions to this project. Please follow these guidelines:

- **Coding Standards**: Write clear, maintainable code with consistent naming conventions and commenting practices.
- **Branch Management**: Use feature branches for new features or fixes. Submit a pull request for review.
- **Testing**: Include tests where applicable and ensure that existing tests pass before submitting.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgments

- **Puppeteer**: Used for headless browser automation to generate PNG images.
- **fs-extra**: For enhanced file system operations.
- **Contributors**: Thanks to everyone who has contributed to the development and improvement of this tool.

## Additional Sections

### Troubleshooting

- **No SVG/PNG Output**: Ensure that your diagram code files are correctly formatted and placed in the `src` directory.
- **Styles Not Applied**: Check the `diagram-style.css` file for syntax errors or conflicts.

### Roadmap

Future enhancements might include:
- **Support for more diagram elements**: Adding additional shapes and connectors.
- **Diagram Export Options**: Supporting more output formats (e.g., PDF).