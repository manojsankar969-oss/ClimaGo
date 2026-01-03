# Weather App

Simple frontend Weather Application using the OpenWeather API.

## Setup

- Obtain a (free) API key from https://openweathermap.org/api
- Open `index.html` in a browser (no build step required).
- Enter your API key in the "OpenWeather API Key" field, type a city name, and click "Search" or press Enter.

## Files

- `index.html` — main page and UI
- `style.css` — dark theme styles
- `script.js` — API calls and DOM logic

## Notes


## Features

- Weather Quality Score (0–10) — a composite comfort metric computed from temperature, humidity, wind and conditions.
- Rule-based Human Advice — clothing, health and travel tips based on current conditions.
- City-to-City Comparison — compare two cities side-by-side and decide which is more comfortable.
- Today Planner — divides the day into Morning/Afternoon/Evening/Night using 3-hour forecasts and gives activity suggestions.
- AQI Display & Alerts — fetches air quality (OpenWeather Air Pollution API) and shows category and frontend alerts.
- Smart Frontend Alerts — banners and optional browser notifications for extreme conditions.
- AI-like Summaries — template-based natural-language summaries without external AI services.

## AI proxy (optional, recommended for real AI summaries)

This project includes a small Node.js proxy to call Google Cloud's Generative Language API (Vertex AI). This keeps your API key server-side instead of exposing it in the browser.

Steps:

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your key.

2. Install dependencies and run the proxy (requires Node 18+ recommended):

```powershell
cd 'c:\workspace\weather proj'
npm install
npm start
```

3. In the UI, enable the "Use AI summary" checkbox to have the app request summaries from the local proxy.

Render deployment (production):

- Add `GEMINI_API_KEY` to your Render service's Environment variables (Dashboard → Environment → Environment Variables).
- Do NOT add your `.env` to the repo — Render reads environment variables from its settings and injects them at runtime.
- Restart or redeploy your service after updating environment variables.

Note: The UI now attempts to use the local AI proxy automatically. If the proxy is not running or the key is not configured, the app will gracefully fall back to the built-in rule-based summary.

Security note: Never commit your `.env` or API keys to source control. The included proxy is for local/testing use.

## Future improvements

- Persist API key in localStorage (optional)

this is by manoj
