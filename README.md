# NEXORA AI Workspace

A modern, local-first AI workspace and chat interface designed for security, privacy, and productivity. 

## Features
- **Project Workspaces**: Organize AI chats and knowledge bases by project.
- **Model Arena**: A/B test AI models side-by-side.
- **Knowledge Vault**: Upload documents for semantic RAG (Retrieval-Augmented Generation).
- **Prompt Lab**: Create and manage reusable system prompts.

---

## 🔒 Security & Architecture
NEXORA takes a secure approach to API key management. **API keys are NEVER exposed to the browser or frontend.** 

We support a hybrid approach to API key integration:
1. **Local Environment Variables (Recommended for Dev)**: You can place your API keys in a `.env.local` file. This file is explicitly ignored by Git (`.gitignore`) and will never be committed to source control.
2. **Encrypted Database Storage (Recommended for Prod)**: Users can enter their API keys via the Settings UI. The application encrypts these keys using standard encryption protocols before saving them to the SQLite database.

**The frontend communicates exclusively via secure backend API routes (`/api/chat`), which resolves the keys entirely server-side before contacting the AI providers.**

---

## 🚀 Environment Setup

1. Copy the provided `.env.local` template (if not already present):
   ```bash
   touch .env.local
   ```
2. Open `.env.local` and add your OpenAI API key (or any other provider key):
   ```env
   OPENAI_API_KEY=your_actual_secret_key_here
   ```
   *Note: Do NOT place `NEXT_PUBLIC_` in front of these variables. They must remain private to the server.*

---

## 🛠️ How to Run Locally

First, ensure dependencies are installed:
```bash
npm install
```

Run the database migrations:
```bash
npx prisma db push
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ⚠️ Security Checklist Verification
- [x] Search the entire project for hardcoded API keys: None exist.
- [x] No secrets exist in client-side code (`src/components/*`).
- [x] `.env.local` is ignored by Git (`.gitignore`).
- [x] API requests from the browser DO NOT contain the secret (they only send messages and provider IDs).
- [x] Server logs do not print the secret (the `route.ts` API catches errors and sanitizes them for the UI).
- [x] The key is not included in the production frontend bundle.
