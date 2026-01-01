// const express = require('express');
// require('dotenv').config();
// const app = express();

// // --- THE CRITICAL CHANGE ---
// // This middleware is required to "accept it as json"
// // It parses the incoming request body so you can use req.body
// app.use(express.json()); 

// const API_KEY = process.env.GOOGLE_API_KEY;

// app.post('/ai', async (req, res) => {
//   console.log('Received AI request');
  
//   // Now req.body will contain your JSON object
//   const { prompt } = req.body; 
//   console.log('Prompt received:', prompt);

//   if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
//   if (!API_KEY) return res.status(500).json({ error: 'API Key not configured' });

//   try {
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }]
//       })
//     });

//     const data = await response.json();

//     if (data.candidates && data.candidates[0].content) {
//       const aiText = data.candidates[0].content.parts[0].text;
//       res.json({ reply: aiText });
//     } else {
//       res.status(500).json({ error: 'Unexpected AI response', details: data });
//     }
//   } catch (e) {
//     console.error('Fetch error:', e);
//     res.status(500).json({ error: e.message });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));