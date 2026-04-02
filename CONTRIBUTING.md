# Contributing to Aura Context

First off, thank you for considering contributing to Aura Context! It's people like you that make open-source such an incredible community to learn, inspire, and create.

## Developing Locally

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Install and run [Ollama](https://ollama.com/) with a pulled model (e.g., `ollama pull llama3`)

### Setup Instructions
1. Fork the repository on GitHub and clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/context-assistant.git
   cd context-assistant
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the dev server and Electron app:
   ```bash
   npm run dev
   ```

### Architecture Overview
- **Vite/React**: All UI files are located in `src/`.
- **Electron Background Processes**: All background tracking, SQLite DB logic, and preload scripts are located in `electron/`.
- **Local DB**: On macOS, the SQLite database is automatically generated in your application data directory.

## Submitting Pull Requests

We love pull requests! Before submitting one:
1. Create a new branch describing your feature or fix (e.g., `feat/add-new-timeline-filter`).
2. Make your code changes.
3. Run the application to ensure nothing is broken.
4. Push your branch to your fork and submit a PR against our `main` branch.

## Issues and Feature Requests
Feel free to submit issues if you find bugs or want to request a new feature. Please provide as much context as possible!
