# TUF Metadata Visualizer

A web-based tool to explore and visualize TUF (The Update Framework) metadata.

**Live URL:** [https://tuf-visualizer.netlify.app/](https://tuf-visualizer.netlify.app/)

## What is TUF? What is this tool?

**TUF (The Update Framework)** is a flexible and secure framework for software update systems, designed to protect against a wide range of attacks. It is widely used in open source and cloud-native ecosystems to ensure the integrity and security of software updates.

**TUF Metadata Visualizer** is a user-friendly web application that allows you to load, inspect, and understand TUF metadata repositories. It is designed for both TUF implementers and users who want to audit or explore TUF-secured repositories.

## What does it do? (Features)

- Load and visualize TUF metadata from any public TUF repository URL
- Choose from sample repositories for quick exploration
- View TUF roles (root, targets, snapshot, timestamp) in a table with expandable rows
- See signers, thresholds, expiration dates, and delegation details
- Compare different root versions with a difference view
- Explore the repository structure with interactive tree visualizations
- Direct links to raw JSON metadata files

## How does it work? (Guide to Use)

1. **Enter a TUF repository URL** or select one of the provided sample repositories (e.g., Sigstore, TUF Demo).
2. **Visualize the metadata**:
   - The main table shows all top-level TUF roles. Click any row to expand and see more details.
   - Use the "Root Version Diff" section to compare different root versions and see what changed.
   - Explore the "TUF Metadata Visualizations" section for interactive trees of roles, delegations, and targets.
3. **Inspect details**: Click on any "json" link to view the raw metadata file.

## Implementation Details & Technologies Used

- **TUF-JS**: Uses the official [tuf-js](https://github.com/theupdateframework/tuf-js) library for parsing and validating TUF metadata.
- **Next.js**: Built with [Next.js](https://nextjs.org/) for fast, modern web UI.
- **React**: Uses [React](https://reactjs.org/) for interactive components.
- **Styled Components**: For modular, themeable styling.
- **Real-world metadata**: Demonstrates with real metadata from Sigstore and other public TUF repositories.

## Getting Started / Local Setup / Contributing

### Prerequisites
- Node.js 18.17.0 or later

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/DeshDeepakKant/TUF-Metadata-Visualizer.git
   cd TUF-Metadata-Visualizer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Contributing
- Contributions are welcome! Please open issues or pull requests for improvements, bug fixes, or new features.

## Contact
We're on Slack ([link](https://app.slack.com/client/T08PSQ7BQ/C08FNCGB5N2))

Feel free to file issues if anything is unclear: this is a new project so docs are still lacking.



