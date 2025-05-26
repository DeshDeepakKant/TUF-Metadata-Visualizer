# 🔍 TUF Metadata Visualizer

The **TUF Metadata Visualizer** creates human-readable visual displays of TUF metadata repositories. It shows complex JSON files in a simple, interactive interface. Without this tool, you would need to read and understand raw JSON files across multiple documents. This visualizer uses tables, diagrams, and root.json comparison views to clearly show how different parts of the metadata connect. This makes auditing, reviewing changes, and verifying security much easier.

**🌐 Live URL:** [https://tuf-visualizer.netlify.app/](https://tuf-visualizer.netlify.app/)


## ✨ Features & Usage

### Getting Started
* Enter a TUF repository URL or select one of the provided sample repositories (e.g., Sigstore, TUF Demo).
* Load and visualize TUF metadata from any public TUF repository URL.

### Exploring the Metadata
* **Main Table View**: See all TUF roles (`root`, `targets`, `snapshot`, `timestamp`, and delegations if any) with signers, thresholds, and expiration dates. Click the row to expand and view delegation details.
* **Root Version Comparison**: Compare different root versions to see what changed between them.
* **Tree Visualizations**: Explore interactive tree diagrams showing the repository structure, roles, and delegations.
* **Direct Access**: Click any "json" link to view the raw metadata file for deeper inspection.


## 🚀 Getting Started

### Prerequisites

* Node.js 18.17.0 or later

### Local Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/DeshDeepakKant/TUF-Metadata-Visualizer.git
   cd TUF-Metadata-Visualizer
   ```



2. **Install dependencies:**

   ```bash
   npm install
   ```



3. **Run the development server:**

   ```bash
   npm run dev
   ```



4. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests for improvements, bug fixes, or new features.


## 📬 Contact

Join our Slack community: [Slack Channel](https://app.slack.com/client/T08PSQ7BQ/C08FNCGB5N2)

Feel free to file issues if anything is unclear—this is a new project, so documentation is still evolving.
