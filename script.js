const apiKey = "e63bf9c08aab3481638f1ad6a926bba4";


async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    const result = document.getElementById("result");

    if (!city) {
        result.innerHTML = "Please enter a city name.";
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;

    result.innerHTML = "Loading...";

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            const message = data && data.message ? data.message : 'Error fetching data';
            result.innerHTML = `Error: ${message}`;
            return;
        }

        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        result.innerHTML = `
            <div class="card">
                <div class="header">
                    <h3>${data.name}, ${data.sys.country}</h3>
                    <img src="${iconUrl}" alt="${data.weather[0].description}" />
                </div>
                <p><strong>Temperature:</strong> ${Math.round(data.main.temp)} °C</p>
                <p><strong>Feels like:</strong> ${Math.round(data.main.feels_like)} °C</p>
                <p><strong>Weather:</strong> ${data.weather[0].description}</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
                <p><strong>Wind:</strong> ${data.wind.speed} m/s</p>
            </div>
        `;

        // Compute quality score and human advice
        const quality = scoreWeather(data);
        const adviceList = generateAdvice(data, quality);

        const qualityEl = document.getElementById('quality');
        qualityEl.innerHTML = `<div class="card"><strong>Weather Score:</strong> ${quality.toFixed(1)}/10</div>`;

        const adviceEl = document.getElementById('advice');
        adviceEl.innerHTML = `<div class="card"><strong>Quick Advice:</strong><ul>${adviceList.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;

        // Fetch AQI using lat/lon
        if (data.coord && data.coord.lat && data.coord.lon) {
            const aqiData = await fetchAQI(data.coord.lat, data.coord.lon);
            renderAQI(aqiData);
            smartAlerts(data, aqiData, quality);
        }

        // Generate summary (AI if enabled and proxy available)
        const summaryEl = document.getElementById('summary');
        const summaryText = await getSummary(data, quality);
        summaryEl.innerHTML = `<div class="card"><strong>Summary:</strong> ${summaryText}</div>`;
            // Best Places suggestions
            const placesEl = document.getElementById('places');
            const places = suggestPlaces(data, quality);
            if (places && places.length) {
                placesEl.innerHTML = places.map(p => `
                    <div class="place-card">
                        <div><span class="place-badge ${p.type==='outdoor'?'badge-outdoor':'badge-indoor'}">${p.type.toUpperCase()}</span><strong>${p.name}</strong></div>
                        <div class="place-reason">${p.reason}</div>
                    </div>
                `).join('');
            } else {
                placesEl.innerHTML = '';
            }

    // --- Best Places recommendation (rule-based, local dataset fallback) ---
    function suggestPlaces(data, score) {
        const city = (data.name || '').toLowerCase();
        const temp = data.main.temp;
        const cond = (data.weather && data.weather[0] && data.weather[0].main) ? data.weather[0].main.toLowerCase() : '';
        const precip = /rain|drizzle|thunder/.test(cond);

        // Simple local dataset for a few example cities (extendable)
        // Each place includes approximate latitude/longitude so we can filter by distance
        const localPlaces = {
            'mumbai': [
                { name: 'Marine Drive', type: 'outdoor', desc: 'coastal promenade and sunset views', lat: 18.9431, lon: 72.8235 },
                { name: 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya', type: 'indoor', desc: 'museum with cultural exhibits', lat: 18.9250, lon: 72.8296 },
                { name: 'Colaba Causeway', type: 'indoor', desc: 'shopping and cafes (covered areas)', lat: 18.9056, lon: 72.8186 }
            ],
            'delhi': [
                { name: 'Lodhi Garden', type: 'outdoor', desc: 'historic gardens and walking paths', lat: 28.5933, lon: 77.2194 },
                { name: 'National Museum', type: 'indoor', desc: 'extensive indoor galleries', lat: 28.6124, lon: 77.2295 },
                { name: 'Connaught Place', type: 'indoor', desc: 'shopping & dining with covered sections', lat: 28.6333, lon: 77.2167 }
            ],
            'bengaluru': [
                { name: 'Cubbon Park', type: 'outdoor', desc: 'large urban park, good for walks', lat: 12.9761, lon: 77.5929 },
                { name: 'Visvesvaraya Industrial and Technological Museum', type: 'indoor', desc: 'interactive indoor exhibits', lat: 12.9759, lon: 77.5950 },
                { name: 'UB City', type: 'indoor', desc: 'upscale mall and dining', lat: 12.9719, lon: 77.5946 }
            ]
            ,
            'hyderabad': [
                { name: 'Charminar', type: 'outdoor', desc: 'historic landmark and market area', lat: 17.3616, lon: 78.4747 },
                { name: 'Golconda Fort', type: 'outdoor', desc: 'historic fort with panoramic views', lat: 17.3833, lon: 78.4011 },
                { name: 'Necklace Road', type: 'outdoor', desc: 'lakeside promenade', lat: 17.4156, lon: 78.4486 }
            ],
            'chennai': [
                { name: 'Marina Beach', type: 'outdoor', desc: 'long urban beach', lat: 13.0489, lon: 80.2820 },
                { name: 'Fort St. George', type: 'indoor', desc: 'historic fort and museum', lat: 13.0830, lon: 80.2854 },
                { name: 'Kapaleeshwarar Temple', type: 'indoor', desc: 'famous temple and cultural site', lat: 13.0255, lon: 80.2707 }
            ],
            'kolkata': [
                { name: 'Victoria Memorial', type: 'outdoor', desc: 'park and museum complex', lat: 22.5448, lon: 88.3426 },
                { name: 'Howrah Bridge', type: 'outdoor', desc: 'iconic bridge and riverside views', lat: 22.5958, lon: 88.2636 },
                { name: 'Indian Museum', type: 'indoor', desc: 'largest museum in India', lat: 22.5726, lon: 88.3635 }
            ],
            'pune': [
                { name: 'Shaniwar Wada', type: 'outdoor', desc: 'historic fortification in city center', lat: 18.5196, lon: 73.8580 },
                { name: 'Aga Khan Palace', type: 'indoor', desc: 'historic landmark with gardens', lat: 18.5602, lon: 73.9106 },
                { name: 'Empress Garden', type: 'outdoor', desc: 'botanical garden and green area', lat: 18.5167, lon: 73.8566 }
            ],
            'ahmedabad': [
                { name: 'Sabarmati Ashram', type: 'indoor', desc: 'historic Gandhi ashram and museum', lat: 23.0600, lon: 72.5976 },
                { name: 'Kankaria Lake', type: 'outdoor', desc: 'recreational lake and attractions', lat: 23.0225, lon: 72.5714 },
                { name: 'Adalaj Stepwell', type: 'outdoor', desc: 'historic stepwell and architecture', lat: 23.0520, lon: 72.5167 }
            ],
            'jaipur': [
                { name: 'Hawa Mahal', type: 'outdoor', desc: 'famous palace with latticed windows', lat: 26.9239, lon: 75.8267 },
                { name: 'Amber Fort', type: 'outdoor', desc: 'historic fort with hilltop views', lat: 26.9855, lon: 75.8513 },
                { name: 'City Palace', type: 'indoor', desc: 'museum and royal complex', lat: 26.9197, lon: 75.8260 }
            ],
            'lucknow': [
                { name: 'Bara Imambara', type: 'indoor', desc: 'historic monument and complex', lat: 26.8469, lon: 80.9094 },
                { name: 'Rumi Darwaza', type: 'outdoor', desc: 'iconic gateway in the old city', lat: 26.8523, lon: 80.9150 },
                { name: 'Hazratganj', type: 'indoor', desc: 'shopping & dining precinct', lat: 26.8496, lon: 80.9462 }
            ],
            'kochi': [
                { name: 'Fort Kochi', type: 'outdoor', desc: 'historic area with colonial architecture', lat: 9.9667, lon: 76.2419 },
                { name: 'Marine Drive', type: 'outdoor', desc: 'seafront promenade', lat: 9.9660, lon: 76.2892 },
                { name: 'Mattancherry Palace', type: 'indoor', desc: 'historic palace and museum', lat: 9.9660, lon: 76.2590 }
            ]
        };

        // Precomputed city centroids (approx) for matching unknown input names by location
        const cityCentroids = {
            'mumbai': { lat: 19.0760, lon: 72.8777 },
            'delhi': { lat: 28.6139, lon: 77.2090 },
            'bengaluru': { lat: 12.9716, lon: 77.5946 }
            , 'hyderabad': { lat: 17.3850, lon: 78.4867 }
            , 'chennai': { lat: 13.0827, lon: 80.2707 }
            , 'kolkata': { lat: 22.5726, lon: 88.3639 }
            , 'pune': { lat: 18.5204, lon: 73.8567 }
            , 'ahmedabad': { lat: 23.0225, lon: 72.5714 }
            , 'jaipur': { lat: 26.9124, lon: 75.7873 }
            , 'lucknow': { lat: 26.8467, lon: 80.9462 }
            , 'kochi': { lat: 9.9312, lon: 76.2673 }
        };


        // Decide preferred place type based on weather
        let preferred = 'outdoor';
        if (precip || temp >= 33 || score < 5) preferred = 'indoor';

        // Get candidates (with coords when available)
        // First try exact name match, otherwise try nearest dataset city by coordinates
        let candidates = localPlaces[city] ? localPlaces[city].slice() : null;
        if (!candidates && cityLat && cityLon) {
            // find nearest dataset city centroid within 100 km
            let nearestKey = null;
            let nearestDist = Infinity;
            for (const k of Object.keys(cityCentroids)) {
                const c = cityCentroids[k];
                const d = haversineDistance(cityLat, cityLon, c.lat, c.lon);
                if (d < nearestDist) { nearestDist = d; nearestKey = k; }
            }
            if (nearestDist <= 100 && nearestKey && localPlaces[nearestKey]) {
                candidates = localPlaces[nearestKey].slice();
            }
        }
        const cityLat = data.coord && data.coord.lat;
        const cityLon = data.coord && data.coord.lon;

        if (candidates && cityLat && cityLon) {
            // compute distance and keep only places within 50 km
            candidates = candidates.map(p => {
                p._distKm = haversineDistance(cityLat, cityLon, p.lat, p.lon);
                return p;
            });

            const within = candidates.filter(p => p._distKm <= 50).sort((a,b)=>a._distKm-b._distKm);
            if (within.length > 0) {
                candidates = within;
            } else {
                // fallback: sort by nearest and keep nearest 3
                candidates.sort((a,b)=>a._distKm-b._distKm);
                candidates = candidates.slice(0,3);
            }
        }

        if (!candidates) {
            // Generic fallbacks when no local dataset — no distance filtering possible
            candidates = [
                { name: 'City Park', type: 'outdoor', desc: 'open green spaces good for walking' },
                { name: 'Local Museum', type: 'indoor', desc: 'cultural exhibits and shelter' },
                { name: 'Shopping Mall', type: 'indoor', desc: 'shopping and dining in sheltered spaces' },
                { name: 'Botanical Garden', type: 'outdoor', desc: 'gardens and plant displays' }
            ];
        }

        // Prioritize candidates matching preferred type
        const preferredList = candidates.filter(p => p.type === preferred);
        const otherList = candidates.filter(p => p.type !== preferred);

        const selected = [];
        // pick up to 2-3 places
        preferredList.slice(0,3).forEach(p => selected.push(p));
        if (selected.length < 2) {
            otherList.slice(0, 3 - selected.length).forEach(p => selected.push(p));
        }

        // Build reasons
        return selected.slice(0,3).map(p => {
            let reason = '';
            if (p.type === 'outdoor') {
                reason = `Good for today because temperature is ${Math.round(temp)}°C and conditions are ${cond || 'clear'}. ${p.desc}.`;
            } else {
                reason = `Better indoors today due to ${precip ? 'expected rain' : (temp >= 33 ? 'high temperatures' : 'comfort considerations')}. ${p.desc}.`;
            }
            if (p._distKm !== undefined) reason += ` (~${Math.round(p._distKm)} km)`;
            return { name: p.name, type: p.type, reason };
        });
    }

    // Haversine formula to compute distance in kilometers between two lat/lon points
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const toRad = v => v * Math.PI / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    } catch (err) {
        result.innerHTML = "Network error. Please try again.";
    }
}

// Allow pressing Enter in the city input to trigger search
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') getWeather();
    });
    // Compare panel toggle
    const toggle = document.getElementById('compareToggle');
    const panel = document.getElementById('comparePanel');
    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            const open = panel.classList.toggle('open');
            panel.setAttribute('aria-hidden', String(!open));
            toggle.setAttribute('aria-expanded', String(open));
            if (open) {
                const a = document.getElementById('cityA');
                if (a) a.focus();
            }
        });
    }
    const closeBtn = document.getElementById('closeCompare');
    if (closeBtn && panel) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
        });
    }
});

// --- Quality score and advice engine ---
function scoreWeather(data) {
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const condition = (data.weather && data.weather[0] && data.weather[0].main) ? data.weather[0].main.toLowerCase() : '';

    // Temperature score (ideal 20-25°C)
    let tScore;
    if (temp >= 20 && temp <= 25) tScore = 1;
    else if (temp < 20) tScore = Math.max(0, 1 - (20 - temp) / 30); // -10°C -> ~0
    else tScore = Math.max(0, 1 - (temp - 25) / 20); // 45°C -> ~0

    // Humidity score (ideal 30-60%)
    let hScore;
    if (humidity >= 30 && humidity <= 60) hScore = 1;
    else if (humidity < 30) hScore = Math.max(0, 1 - (30 - humidity) / 30);
    else hScore = Math.max(0, 1 - (humidity - 60) / 40);

    // Wind score (preferred calm)
    let wScore;
    if (wind <= 5) wScore = 1;
    else if (wind <= 15) wScore = Math.max(0, 1 - (wind - 5) / 10);
    else wScore = 0;

    // Condition score (penalize rain/snow/thunder)
    let cScore = 1;
    if (/rain|snow|thunder|drizzle/.test(condition)) cScore = 0.2;
    else if (/mist|fog|smoke|haze/.test(condition)) cScore = 0.5;

    // Weights (sum to 1)
    const w = { temp: 0.4, humidity: 0.25, wind: 0.15, condition: 0.2 };

    const normalized = (tScore * w.temp) + (hScore * w.humidity) + (wScore * w.wind) + (cScore * w.condition);
    const scoreOutOf10 = Math.round(normalized * 10 * 10) / 10; // one decimal
    return scoreOutOf10;
}

function generateAdvice(data, score) {
    const advice = [];
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const desc = data.weather[0].description;

    // Temperature-based
    if (temp >= 30) advice.push('Very warm — stay hydrated and avoid strenuous midday activity.');
    else if (temp >= 24) advice.push('Warm — light clothing is fine, consider sunscreen if sunny.');
    else if (temp >= 15) advice.push('Mild — comfortable for most outdoor activities.');
    else if (temp >= 5) advice.push('Cool — consider a light jacket.');
    else advice.push('Cold — wear layers and protect extremities.');

    // Humidity-based
    if (humidity >= 75) advice.push('High humidity — it may feel hotter; choose breathable fabrics.');
    else if (humidity <= 30) advice.push('Low humidity — stay hydrated and moisturize skin if needed.');

    // Rain/wet conditions
    if (/rain|drizzle|thunder/.test(desc)) advice.push('Rain expected — carry an umbrella or wear a waterproof jacket.');

    // Wind
    if (wind >= 10) advice.push('Windy — secure loose items and be cautious when cycling.');

    // Score-based summary
    if (score >= 8) advice.unshift('Overall: Very pleasant weather today.');
    else if (score >= 6) advice.unshift('Overall: Fairly comfortable weather.');
    else if (score >= 4) advice.unshift('Overall: Some discomfort expected; plan activities carefully.');
    else advice.unshift('Overall: Poor conditions — consider indoor plans and safety precautions.');

    return advice.slice(0, 6); // limit number of lines
}

// --- City-to-city comparison ---
async function compareTwoCities() {
    const a = document.getElementById('cityA').value.trim();
    const b = document.getElementById('cityB').value.trim();
    const comp = document.getElementById('comparison');
    if (!a || !b) { comp.innerHTML = 'Enter both city names'; return; }

    comp.innerHTML = 'Comparing...';
    try {
        const [wa, wb] = await Promise.all([fetchWeatherByName(a), fetchWeatherByName(b)]);
        if (!wa || !wb) { comp.innerHTML = 'Could not fetch one or both cities.'; return; }

        const scoreA = scoreWeather(wa);
        const scoreB = scoreWeather(wb);

        const winner = scoreA === scoreB ? 'Tie' : (scoreA > scoreB ? a : b);

        comp.innerHTML = `
            <div class="card">
                <h3>Comparison</h3>
                <p><strong>${a}:</strong> ${Math.round(wa.main.temp)}°C, ${wa.main.humidity}% humidity, ${wa.wind.speed} m/s, Score ${scoreA}/10</p>
                <p><strong>${b}:</strong> ${Math.round(wb.main.temp)}°C, ${wb.main.humidity}% humidity, ${wb.wind.speed} m/s, Score ${scoreB}/10</p>
                <p><strong>Better Today:</strong> ${winner === 'Tie' ? 'Tie' : winner + ' (' + (winner===a? 'City A':'City B') + ')'}</p>
                <p><strong>Reason:</strong> ${explainComparison(wa, wb)}</p>
            </div>
        `;
        // auto-close compare panel after showing results
        const panel = document.getElementById('comparePanel');
        const toggle = document.getElementById('compareToggle');
        if (panel && toggle) {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
        }
    } catch (e) { comp.innerHTML = 'Error comparing cities.'; }
}

async function fetchWeatherByName(name) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(name)}&units=metric&appid=${apiKey}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

function explainComparison(wa, wb) {
    const scoreA = scoreWeather(wa);
    const scoreB = scoreWeather(wb);
    const parts = [];
    if (Math.abs(scoreA - scoreB) < 1) parts.push('Scores are close; both cities have similar comfort.');
    else if (scoreA > scoreB) parts.push(`${wa.name} is more comfortable based on temperature and humidity.`);
            qualityEl.innerHTML = `
                <div class="card">
                    <strong>Weather Score:</strong> ${quality.toFixed(1)}/10
                    <div class="comfort-bars" id="comfortBars"></div>
                    <div class="comfort-labels"><span>Temp</span><span>Humidity</span><span>Wind</span><span>Cond</span></div>
                </div>
            `;

            // render comfort breakdown bars
            const breakdown = computeBreakdown(data);
            const bars = document.getElementById('comfortBars');
            if (bars) {
                bars.innerHTML = '';
                ['temp','humidity','wind','condition'].forEach(k => {
                    const val = Math.round((breakdown[k]||0)*100);
                    const bar = document.createElement('div');
                    bar.className = 'comfort-bar';
                    bar.innerHTML = `<i style="width:${val}%"></i>`;
                    bars.appendChild(bar);
                });
            }
    if (/rain|snow|thunder/.test(wa.weather[0].description)) parts.push(`${wa.name} has precipitation which lowers comfort.`);
    if (/rain|snow|thunder/.test(wb.weather[0].description)) parts.push(`${wb.name} has precipitation which lowers comfort.`);
    return parts.join(' ');
}

// --- AQI fetching and rendering ---
async function fetchAQI(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        return json;
    } catch { return null; }
}

function renderAQI(aqiData) {
    const el = document.getElementById('aqi');
    if (!aqiData || !aqiData.list || !aqiData.list[0]) { el.innerHTML = ''; return; }
    const a = aqiData.list[0].main.aqi; // 1-5 (OpenWeather scale)
    const map = {1: 'Good',2:'Fair',3:'Moderate',4:'Poor',5:'Very Poor'};
    const color = {1:'#4caf50',2:'#8bc34a',3:'#ffeb3b',4:'#ff9800',5:'#f44336'}[a] || '#9e9e9e';
    el.innerHTML = `<div class="card"><strong>AQI:</strong> <span style="color:${color}">${map[a]} (${a})</span></div>`;
}

// --- Smart alerts (frontend-only) ---
function smartAlerts(weatherData, aqiData, score) {
    const container = document.getElementById('alerts');

    // computeBreakdown uses the same rules as scoreWeather but returns component fractions
    function computeBreakdown(data) {
        const temp = data.main.temp;
        const humidity = data.main.humidity;
        const wind = data.wind.speed;
        const condition = (data.weather && data.weather[0] && data.weather[0].main) ? data.weather[0].main.toLowerCase() : '';

        let tScore;
        if (temp >= 20 && temp <= 25) tScore = 1;
        else if (temp < 20) tScore = Math.max(0, 1 - (20 - temp) / 30);
        else tScore = Math.max(0, 1 - (temp - 25) / 20);

        let hScore;
        if (humidity >= 30 && humidity <= 60) hScore = 1;
        else if (humidity < 30) hScore = Math.max(0, 1 - (30 - humidity) / 30);
        else hScore = Math.max(0, 1 - (humidity - 60) / 40);

        let wScore;
        if (wind <= 5) wScore = 1;
        else if (wind <= 15) wScore = Math.max(0, 1 - (wind - 5) / 10);
        else wScore = 0;

        let cScore = 1;
        if (/rain|snow|thunder|drizzle/.test(condition)) cScore = 0.2;
        else if (/mist|fog|smoke|haze/.test(condition)) cScore = 0.5;

        return { temp: tScore, humidity: hScore, wind: wScore, condition: cScore };
    }
    const alerts = [];
    const temp = weatherData.main.temp;
    const desc = weatherData.weather[0].description;
    const wind = weatherData.wind.speed;
    let aqi = null;
    if (aqiData && aqiData.list && aqiData.list[0]) aqi = aqiData.list[0].main.aqi;

    if (temp >= 40) alerts.push('Heat alert: temperature >= 40°C — avoid outdoor exercise.')
    if (/thunder|storm/.test(desc)) alerts.push('Storm alert: severe weather expected; seek shelter.')
    if (wind >= 15) alerts.push('Wind alert: strong winds — secure loose objects.')
    if (aqi && (aqi >= 4)) alerts.push('Air quality alert: limit outdoor exposure for sensitive groups.')
    if (score <= 3) alerts.push('Comfort alert: poor weather conditions, consider indoor plans.')

    if (alerts.length === 0) { container.innerHTML = ''; return; }

    // Avoid spamming: store last alerts hash
    const last = localStorage.getItem('lastAlerts');
    const hash = alerts.join('|');
    if (last === hash) { container.innerHTML = ''; return; }
    localStorage.setItem('lastAlerts', hash);

    container.innerHTML = `<div class="card"><strong>Alerts:</strong><ul>${alerts.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
    // Optionally request Notification permission (silent) and show a notification
    if ("Notification" in window && Notification.permission === 'granted') {
        new Notification('Weather Alerts', { body: alerts.join('; ') });
    } else if ("Notification" in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

// --- AI-like natural summary (template & synonyms) ---
function generateSummary(data, score) {
    const city = data.name;
    const temp = Math.round(data.main.temp);
    const cond = data.weather[0].description;
    const adjectives = (temp >= 30) ? ['hot','toasty','warm'] : (temp <= 10) ? ['cold','chilly','brisk'] : ['pleasant','mild','comfortable'];
    const adj = adjectives[Math.floor(Math.random()*adjectives.length)];
    const templates = [
        `It's ${adj} in ${city} at ${temp}°C with ${cond}. Overall score ${score}/10.`,
        `${city} is seeing ${cond} and ${temp}°C. Comfort score: ${score}/10.`,
        `Weather update for ${city}: ${temp}°C, ${cond}. ${score >= 7 ? 'Nice day to be outdoors.' : 'You may want to adjust plans.'}`
    ];
    return templates[Math.floor(Math.random()*templates.length)];
}

async function callAI(prompt) {
    summary_prompt = `
    Act as a localized lifestyle expert. Using the provided weather data, generate a concise guide for a Hyderabad resident. 
    Recommend **breathable clothing** suitable for 26°C, suggest **indoor or low-impact outdoor activities** considering the conditions, and provide **health precautions** regarding air quality and visibility. 
    Finally, identify the **optimal time to head out** based on current humidity and wind speed.
    Ensure the tone is helpful and the output is structured into short, scannable bullet points—Clothing, 
    Activities, Health, and Best Time—perfect for a quick-glance UI display. 
    Provie proper html tags to diaplay in a web app.

    Weather information is: ${prompt}
    `;
    console.log('Attempting to call AI proxy...');
    const API_KEY = 'AIzaSyACdTt9AKsckbgomRktN2Js7jy6aHodcWE'
    // 1. Define the API Key (Note: This is visible to users in frontend)
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    console.log('Calling Gemini API directly...');

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: summary_prompt }]
                }]
            })
        });

        const j = await res.json();

        // Handle API Errors (like quota or invalid key)
        if (j.error) {
            return `API Error: ${j.error.message}`;
        }

        // Extract the text from the Gemini response structure
        if (j.candidates && j.candidates[0].content) {
            return j.candidates[0].content.parts[0].text;
        }

        return "No response from AI.";
    } catch (e) {
        return `Connection Error: ${e.message}`;
    }
}

async function getSummary(data, score) {
    // Try AI proxy first; if it fails, fall back to rule-based summary
    const prompt = `current weather for ${data.name}. Temperature ${Math.round(data.main.temp)}°C, condition ${data.weather[0].description}, humidity ${data.main.humidity}%, wind ${data.wind.speed} m/s.`;
    const reply = await callAI(prompt);
    if (reply && !reply.startsWith('AI proxy error') && !reply.startsWith('AI error')) return reply;
    return generateSummary(data, score);
}

// --- Today Planner (uses 3-hour forecast) ---
async function fetchForecastByName(name) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(name)}&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

function hourToSlot(h) {
    if (h >= 6 && h <= 11) return 'Morning';
    if (h >= 12 && h <= 17) return 'Afternoon';
    if (h >= 18 && h <= 21) return 'Evening';
    return 'Night';
}

function slotSuggestion(avgTemp, maxPop, dominant) {
    if (maxPop >= 0.6) return 'Rain likely — prefer indoor activities and carry an umbrella.';
    if (/thunder|storm/.test(dominant)) return 'Storm expected — avoid outdoor plans.';
    if (avgTemp >= 35) return 'Very hot — avoid strenuous outdoor activity in this slot.';
    if (avgTemp <= 5) return 'Cold — consider indoor or warm clothing.';
    return 'Good for outdoor plans.';
}

async function showPlanner() {
    const city = document.getElementById('cityInput').value.trim();
    const plannerEl = document.getElementById('planner');
    plannerEl.innerHTML = '';
    if (!city) { plannerEl.innerHTML = 'Enter a city in the main search box to generate today planner.'; return; }

    plannerEl.innerHTML = 'Loading planner...';
    const forecast = await fetchForecastByName(city);
    if (!forecast || !forecast.list) { plannerEl.innerHTML = 'Could not fetch forecast.'; return; }

    const tz = forecast.city && forecast.city.timezone ? forecast.city.timezone : 0; // seconds
    const nowUTC = Math.floor(Date.now() / 1000);
    const localNowDay = new Date((nowUTC + tz) * 1000).getUTCDate();

    const slots = { 'Morning': [], 'Afternoon': [], 'Evening': [], 'Night': [] };

    for (const item of forecast.list) {
        const localSec = item.dt + tz;
        const d = new Date(localSec * 1000);
        const day = d.getUTCDate();
        if (day !== localNowDay) continue; // only today
        const h = d.getUTCHours();
        const slot = hourToSlot(h);
        slots[slot].push(item);
    }

    // Render slots
    const parts = [];
    for (const [slotName, items] of Object.entries(slots)) {
        if (items.length === 0) {
            parts.push(`<div class="planner-slot"><strong>${slotName}:</strong> No data</div>`);
            continue;
        }
        const temps = items.map(i => i.main.temp);
        const avgTemp = Math.round((temps.reduce((a,b) => a+b,0) / temps.length) * 10) / 10;
        const pops = items.map(i => i.pop || 0);
        const maxPop = Math.round(Math.max(...pops) * 100) / 100;
        const conds = {};
        for (const i of items) {
            const c = i.weather && i.weather[0] && i.weather[0].description ? i.weather[0].description : '';
            conds[c] = (conds[c] || 0) + 1;
        }
        const dominant = Object.keys(conds).reduce((a,b) => conds[a] > conds[b] ? a : b);
        const suggestion = slotSuggestion(avgTemp, maxPop, dominant);

        parts.push(`
            <div class="planner-slot">
                <strong>${slotName}:</strong>
                <div>Avg: ${avgTemp}°C • Precip chance: ${Math.round(maxPop*100)}%</div>
                <div>Condition: ${dominant}</div>
                <div><em>${suggestion}</em></div>
            </div>
        `);
    }

    plannerEl.innerHTML = `<div class="card">${parts.join('')}</div>`;
}
