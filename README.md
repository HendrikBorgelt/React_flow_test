# React Flow Schema Viewer

An interactive schema visualizer built with [React](https://react.dev/) and [React Flow (@xyflow/react)](https://reactflow.dev/). Supports multiple schemas (ChemDCAT, CoreMeta4CAT, DCAT-AP+) with node-based graph editing.


https://hendrikborgelt.github.io/React_flow_test/

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Linux](#linux)
- [Running the App](#running-the-app)
- [Building for Production](#building-for-production)
- [Available Scripts](#available-scripts)

---

## Prerequisites

This project requires **Node.js** (v18 or later recommended) and **npm** (included with Node.js).

---

## Installation

### Windows

1. **Install Node.js**

   Download and run the Windows installer from the official Node.js website:
   ```
   https://nodejs.org/en/download
   ```
   Choose the **LTS** version. npm is bundled with the installer.

   Verify the installation by opening **Command Prompt** or **PowerShell**:
   ```powershell
   node --version
   npm --version
   ```

2. **Clone the repository**
   ```powershell
   git clone https://github.com/Hendrik/React_flow_test.git
   cd React_flow_test
   ```

3. **Install dependencies**
   ```powershell
   npm install
   ```

---

### macOS

1. **Install Node.js**

   **Option A — Official installer** (recommended for beginners):
   Download the macOS installer from:
   ```
   https://nodejs.org/en/download
   ```

   **Option B — Homebrew** (recommended if you already use Homebrew):
   ```bash
   brew install node
   ```

   **Option C — nvm** (recommended if you manage multiple Node versions):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   # Restart your terminal, then:
   nvm install --lts
   nvm use --lts
   ```

   Verify the installation:
   ```bash
   node --version
   npm --version
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/Hendrik/React_flow_test.git
   cd React_flow_test
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

---

### Linux

1. **Install Node.js**

   **Option A — Package manager (Ubuntu/Debian)**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```
   > For an up-to-date LTS version, use the NodeSource repository:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

   **Option B — Package manager (Fedora/RHEL/CentOS)**:
   ```bash
   sudo dnf install nodejs npm
   ```
   > For an up-to-date LTS version via NodeSource:
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
   sudo dnf install -y nodejs
   ```

   **Option C — nvm** (works on any distro, recommended for flexibility):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   # Restart your terminal or run:
   source ~/.bashrc
   nvm install --lts
   nvm use --lts
   ```

   Verify the installation:
   ```bash
   node --version
   npm --version
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/Hendrik/React_flow_test.git
   cd React_flow_test
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

---

## Running the App

Start the development server with the default schema:
```bash
npm run dev
```

Start with a specific schema:
```bash
npm run dev:coremeta4cat
npm run dev:dcat-ap-plus
```

Then open your browser at `http://localhost:5173`.

---

## Building for Production

Build all schemas:
```bash
npm run build:all
```

Build a single schema (ChemDCAT):
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (default schema) |
| `npm run dev:coremeta4cat` | Start dev server with CoreMeta4CAT schema |
| `npm run dev:dcat-ap-plus` | Start dev server with DCAT-AP+ schema |
| `npm run build` | Build ChemDCAT schema for production |
| `npm run build:all` | Build all schemas for production |
| `npm run build:app` | Build the app (no schema target) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
