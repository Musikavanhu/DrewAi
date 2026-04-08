/**
 * Drew AI — Backend Proxy Server
 *
 * Proxies /api/chat requests to Hugging Face's OpenAI-compatible chat endpoint.
 * Keeps API keys and provider URLs out of the frontend codebase.
 *
 * Usage:
 *   cd server && npm install && npm start
 *   (Vite dev server auto-proxies /api/* here via vite.config.js)
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Readable } = require('stream')

const app = express()
const PORT = process.env.PORT || 3001
const DEFAULT_HF_URL = 'https://router.huggingface.co/v1/chat/completions'
const DEFAULT_HF_MODEL = 'meta-llama/Llama-3.1-8B-Instruct:fastest'

function resolveProviderConfig() {
  const requestedProvider = (process.env.AI_PROVIDER || 'huggingface').trim().toLowerCase()

  if (requestedProvider === 'lm-studio') {
    const endpoint = process.env.LM_STUDIO_URL
    const model = process.env.LM_MODEL

    return {
      provider: 'lm-studio',
      endpoint,
      model,
      apiKey: null,
      configured: Boolean(endpoint),
      configError: 'LM_STUDIO_URL is not set in server/.env',
    }
  }

  const apiKey = process.env.HF_API_KEY || process.env.HF_TOKEN || process.env.OPENAI_API_KEY
  const endpoint = process.env.HF_BASE_URL || DEFAULT_HF_URL
  const model = process.env.HF_MODEL || DEFAULT_HF_MODEL

  return {
    provider: 'huggingface',
    endpoint,
    model,
    apiKey,
    configured: Boolean(apiKey),
    configError: 'HF_API_KEY is not set in server/.env',
  }
}

function serializeHealth() {
  const config = resolveProviderConfig()
  return {
    status: config.configured ? 'ok' : 'misconfigured',
    provider: config.provider,
    model: config.model,
    endpoint: config.endpoint,
    configured: config.configured,
    error: config.configured ? null : config.configError,
  }
}

function normalizeUpstreamError(text) {
  try {
    const parsed = JSON.parse(text)
    return parsed.error?.message || parsed.error || text
  } catch {
    return text
  }
}

const startupHealth = serializeHealth()
if (!startupHealth.configured) {
  console.warn(`[Drew Server] Warning: ${startupHealth.error}`)
}

// Allow requests from the Vite dev server and any local origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['POST', 'GET', 'OPTIONS'],
}))
app.use(express.json({ limit: '4mb' }))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json(serializeHealth())
})

// ── Chat completions proxy ────────────────────────────────────────────────────
// Forwards to Hugging Face (or legacy LM Studio), supports both streaming (SSE)
// and non-streaming responses while keeping the frontend request format stable.
app.post('/api/chat', async (req, res) => {
  const config = resolveProviderConfig()

  if (!config.configured) {
    return res.status(500).json({ error: config.configError })
  }

  const body = {
    ...req.body,
    // Always inject the configured model — overrides any client-supplied value
    model: config.model,
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      ...(body.stream ? { Accept: 'text/event-stream' } : {}),
    }

    const upstream = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!upstream.ok) {
      const txt = await upstream.text()
      return res.status(upstream.status).json({ error: normalizeUpstreamError(txt) })
    }

    // Pipe content-type so the browser gets the right SSE / JSON headers
    const ct = upstream.headers.get('content-type') || 'application/json'
    res.setHeader('Content-Type', ct)

    // Pipe the upstream body directly to the client (works for both stream and non-stream)
    Readable.fromWeb(upstream.body).pipe(res)
  } catch (err) {
    console.error('[Drew Server] Upstream error:', err.message)
    res.status(502).json({
      error: `Cannot reach ${config.provider === 'huggingface' ? 'Hugging Face' : 'LM Studio'} at ${config.endpoint}.`,
    })
  }
})

app.listen(PORT, () => {
  console.log(`\n🤖  Drew AI server running on http://localhost:${PORT}`)
  console.log(`🔌  Provider → ${startupHealth.provider}`)
  console.log(`📡  Proxying → ${startupHealth.endpoint}`)
  console.log(`🧠  Model    → ${startupHealth.model}`)
  if (!startupHealth.configured) {
    console.log(`⚠️   Config   → ${startupHealth.error}`)
  }
  console.log('')
})
