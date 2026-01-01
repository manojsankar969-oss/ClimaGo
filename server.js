const express = require('express');
require('dotenv').config();

// node-fetch import (required in Node 18+ on Render)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

// Gemini AI proxy
const API_KEY = process.env.GOOGLE_API_KEY;

app.post('/ai', async (req, res) => {
  console.log('Received AI request');

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content) {
      const aiText = data.candidates[0].content.parts[0].text;
      return res.json({ reply: aiText });
    }

    res.status(500).json({ error: 'Unexpected AI response', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================== START SERVER ================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
