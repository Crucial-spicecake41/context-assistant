# 🚀 Aura Context - Launch Kit

This document contains pre-written templates you can use to market your open-source application and gain GitHub stars.

---

## 📍 1. Hacker News (Show HN) Draft

**Title:**
`Show HN: Aura Context – An open-source, fully offline AI assistant for macOS`

**Body:**
```text
Hey HN,

I wanted to share a desktop app I've been building called Aura Context. It's a completely local, privacy-first AI desktop assistant for macOS. 

It runs quietly in the background to track your active window titles and clipboard history, saving all that context into a local SQLite database. Then, it uses Ollama (I've been testing with Llama 3) to act as a "second brain", letting you chat with an AI that genuinely remembers what you were just working on.

Crucially, **nothing leaves your machine.** No cloud uploads, no API keys, and no telemetry. It also generates a productivity score based on an auto-categorization engine.

Tech Stack:
- Electron
- React / Vite
- better-sqlite3
- Ollama

GitHub Repo: https://github.com/maheshsd/context-assistant
Download: https://github.com/maheshsd/context-assistant/releases/latest

I'd love your feedback on the architecture or the UI (went heavy on glassmorphism!). Happy to answer any questions about syncing Electron with local LLMs.
```

---

## 📍 2. Reddit Draft (r/LocalLLaMA or r/macapps)

**Title:**
`I built an open-source macOS assistant that tracks screen context locally and connects to Ollama (No Cloud!) 🧠`

**Body (Attach the Dashboard screenshot!):**
```text
Hey everyone!

I'm a huge fan of local AI, but I didn't want any cloud service tracking what's on my screen just so I could talk to an AI about it. 

So I built **Aura Context** – a sleek macOS app that acts as an intelligent assistant. 

**Features:**
*   **100% Offline and Private:** It captures active window metadata and clipboards locally into SQLite.
*   **Ollama Native:** The chat interface connects straight to your local Ollama instance (I use Llama 3) to answer questions about your digital context.
*   **Productivity Intelligence:** It auto-categorizes what you work on and generates visualizations/scores for your entire day.

I just open-sourced the whole thing! If you're interested in giving it a try or checking out how the React + Electron + Local LLM architecture works, here’s the repo: 

GitHub: [Link to Repo](https://github.com/maheshsd/context-assistant)

Would mean a lot if you gave it a ⭐️ if you find it useful. Let me know what you think of the design!
```

---

## 📍 3. GitHub Topics to Add (Do this in your Repository Settings)
Go to your repo -> Click the ⚙️ icon next to "About" -> Add these topics:
`electron`, `react`, `ollama`, `local-llm`, `privacy-first`, `productivity`, `ai-assistant`, `macos-app`
