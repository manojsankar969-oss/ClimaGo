const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json());

const API_KEY = process.env.GOOGLE_API_KEY;

app.post('/ai', async (req, res) => {
  const prompt = req.body.prompt;
  if (!API_KEY) return res.status(500).json({ error: 'Google API key not configured. Set GOOGLE_API_KEY in .env' });
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: { text: prompt }, maxOutputTokens: 250 })
    });
    const j = await response.json();
    const text = (j.candidates && j.candidates[0] && j.candidates[0].output) ? j.candidates[0].output : (j.output ? j.output : JSON.stringify(j));
    res.json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI proxy listening on http://localhost:${PORT}`));
