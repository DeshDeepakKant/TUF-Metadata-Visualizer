# TUF Metadata Visualizer

This repository contains a web application to visualize TUF (The Update Framework) metadata. It provides a user-friendly interface to explore TUF roles, keys, and signing requirements.

## Features

- View TUF roles (root, targets, snapshot, timestamp)
- See signers for each role with proper username display
- Visualize delegated targets
- Check expiration dates for each role
- View thresholds and signing requirements
- Direct links to JSON metadata files

## Implementation Details

This application uses:

- **TUF-JS Models**: We use the built-in models from `tuf-js` to parse and handle TUF metadata. This ensures correctness with the TUF specification and keeps our codebase smaller and more maintainable.
- **Real-life Metadata**: We use real-world metadata from the Sigstore TUF repository that demonstrates thresholds > 1 and multiple allowed signers per role.

## Sample Metadata

The metadata files were sourced from:

- [12.root.json](https://tuf-repo-cdn.sigstore.dev/12.root.json)
- [timestamp.json](https://tuf-repo-cdn.sigstore.dev/timestamp.json)
- [159.snapshot.json](https://tuf-repo-cdn.sigstore.dev/159.snapshot.json)
- [11.targets.json](https://tuf-repo-cdn.sigstore.dev/11.targets.json)

The metadata includes additional delegated targets for:
- registry.npmjs.org
- rekor
- revocation
- staging

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


![Uploading image.png…]()

