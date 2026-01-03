const express = require('express');
require('dotenv').config();

// Use built-in fetch when available (Node 18+). Otherwise dynamically import node-fetch.
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

const app = express();

/* ================== MIDDLEWARE ================== */

// parse JSON body
app.use(express.json());

// ⭐ SERVE FRONTEND FILES (index.html, css, js)
app.use(express.static(__dirname));

/* ================== ROUTES ================== */

// ⭐ ROOT ROUTE (fixes "Cannot GET /")
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Gemini/Generative API key - prefer GEMINI_API_KEY, fallback to GOOGLE_API_KEY if present
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. AI endpoints will return 500 until configured.');
}

app.post('/ai', async (req, res) => {
  console.log('Received AI request');

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty prompt' });
  }
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY not set' });
  }

  try {
    // Use the Generative Language text generation endpoint (v1beta2) as a stable target.
    // If you prefer a different model, change the model path accordingly.
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${encodeURIComponent(API_KEY)}`;

    const body = {
      prompt: { text: prompt },
      maxOutputTokens: 300,
      temperature: 0.2
    };

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => '');
      console.error('Upstream error', upstream.status, txt);
      return res.status(502).json({ error: 'Upstream API error', status: upstream.status, body: txt });
    }

    const data = await upstream.json();

    // Try multiple possible response shapes for compatibility
    const reply = data?.candidates?.[0]?.output || data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.output || JSON.stringify(data);
    return res.json({ reply });
  } catch (err) {
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: 'Server error calling AI service', detail: String(err) });
  }
});

/* ================== START SERVER ================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
