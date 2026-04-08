# Drew AI

A smart AI travel and chat agent powered by Hugging Face through a local backend proxy.

---

## Project Structure

```
DrewAi/
├── src/          ← Vite + React frontend
├── server/       ← Express proxy server (keeps API keys private)
├── vite.config.js
└── .gitignore
```

---

## Getting Started

### 1. Start the backend proxy server

```bash
cd server
cp .env.example .env   # then add your Hugging Face token + model
npm install
npm start
```

The server runs on **http://localhost:3001** and proxies all AI requests to Hugging Face's OpenAI-compatible chat completions endpoint.
Use a Hugging Face token that has `Make calls to Inference Providers` permission.

### 2. Start the frontend dev server

```bash
# From the DrewAi root
npm install
npm run dev
```

Vite auto-proxies `/api/*` to the backend — no CORS issues, no exposed keys.

---

## Configuration (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `AI_PROVIDER` | Active upstream provider | `huggingface` |
| `HF_API_KEY` | Hugging Face token with Inference Providers permission | `hf_...` |
| `HF_BASE_URL` | Hugging Face OpenAI-compatible chat endpoint | `https://router.huggingface.co/v1/chat/completions` |
| `HF_MODEL` | Hugging Face chat model id | `meta-llama/Llama-3.1-8B-Instruct:fastest` |
| `PORT` | Port for the proxy server | `3001` |

> ⚠️ **Never commit `server/.env`** — it's in `.gitignore`. Share config via `server/.env.example` only.

If you need the previous local setup for comparison, the server also understands `AI_PROVIDER=lm-studio` plus `LM_STUDIO_URL` and `LM_MODEL`.

---

## Features

- 💬 **Persistent chat history** — multi-chat with localStorage
- 🧠 **Personal memory** — auto-extracts and injects facts about you
- ✈️ **Trip Agent** — NLP trip intake → confidence scoring → fragility map
- ⚡ **Recovery Mode** — simulates disruptions, generates 3 recovery paths
- 🔒 **Secure by default** — the Hugging Face token never reaches the browser

---

## Tech Stack

- **Frontend**: Vite + React, Vanilla CSS
- **Backend**: Node.js + Express (proxy only)
- **AI**: Hugging Face Inference Providers via the OpenAI-compatible chat API
