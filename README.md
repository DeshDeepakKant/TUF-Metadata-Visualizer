# TUF Metadata Visualizer

A web-based viewer for exploring and visualizing [The Update Framework (TUF)](https://theupdateframework.io/) metadata. This application allows you to view and analyze the role information, signatures, and relationships within a TUF repository.

## Features

- **Role Information Display**: View detailed information about all TUF roles (root, targets, snapshot, timestamp)
- **Metadata Visualization**: Inspect metadata structure and content in a user-friendly format
- **Error Handling**: Clear error messages and guidance when metadata files can't be loaded
- **Modern UI**: Clean, responsive interface built with Next.js 14

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/DeshDeepakKant/TUF-Metadata-Visualizer.git
   cd TUF-Metadata-Visualizer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Usage

The application expects TUF metadata files to be located in the `public/metadata` directory:
- root.json
- timestamp.json
- snapshot.json
- targets.json

Sample metadata files are included in the repository for demonstration purposes.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for server-rendered applications
- [React](https://reactjs.org/) - UI library
- [TUF-JS](https://github.com/theupdateframework/tuf-js) - JavaScript implementation of The Update Framework

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Update Framework team for creating the TUF specification
