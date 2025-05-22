# 🔍 TUF Metadata Visualizer

The **TUF Metadata Visualizer** is a user-friendly web application that allows you to explore and understand metadata from repositories using **The Update Framework (TUF)**. It provides interactive features like expandable tables, tree diagrams, and comparison views to help you see how different parts of the metadata relate to each other. Built with modern web technologies such as **Next.js** and **React**, and utilizing the official **tuf-js** library, it offers a responsive and intuitive experience for developers, security analysts, and auditors.

**🌐 Live URL:** [https://tuf-visualizer.netlify.app/](https://tuf-visualizer.netlify.app/)



## 📘 What is TUF? What is this tool?

**The Update Framework (TUF)** is a flexible and secure framework for software update systems, designed to protect against a wide range of attacks. It is widely used in open-source and cloud-native ecosystems to ensure the integrity and security of software updates.

**TUF Metadata Visualizer** is a user-friendly web application that allows you to load, inspect, and understand TUF metadata repositories. It is designed for both TUF implementers and users who want to audit or explore TUF-secured repositories.

Additionally, **TUF-on-CI** is a tool that facilitates secure artifact delivery by operating a TUF repository and signing system within Continuous Integration platforms. It supports features like hardware-backed signing (e.g., Yubikeys), guided signing events, and automated online signing, enhancing the security and automation of software supply chains. ([github.com](https://github.com/theupdateframework/tuf-on-ci?utm_source=chatgpt.com))



## ✨ Features

* Load and visualize TUF metadata from any public TUF repository URL.
* Choose from sample repositories for quick exploration.
* View TUF roles (`root`, `targets`, `snapshot`, `timestamp`) in a table with expandable rows.
* See signers, thresholds, expiration dates, and delegation details.
* Compare different root versions with a difference view.
* Explore the repository structure with interactive tree visualizations.
* Direct links to raw JSON metadata files.


## 🛠️ How to Use

1. **Enter a TUF repository URL** or select one of the provided sample repositories (e.g., Sigstore, TUF Demo).
2. **Visualize the metadata**:

   * The main table shows all top-level TUF roles. Click any row to expand and see more details.
   * Use the "Root Version Diff" section to compare different root versions and see what changed.
   * Explore the "TUF Metadata Visualizations" section for interactive trees of roles, delegations, and targets.
3. **Inspect details**: Click on any "json" link to view the raw metadata file.


## 🧰 Implementation Details & Technologies Used

* **TUF-JS**: Utilizes the official [tuf-js](https://github.com/theupdateframework/tuf-js) library for parsing and validating TUF metadata.
* **Next.js**: Built with [Next.js](https://nextjs.org/) for a fast, modern web UI.
* **React**: Employs [React](https://reactjs.org/) for interactive components.
* **Styled Components**: For modular, themeable styling.
* **Real-world metadata**: Demonstrates with real metadata from Sigstore and other public TUF repositories.


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
