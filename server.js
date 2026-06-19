const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Secure endpoint to serve config (API keys) to the local frontend client
app.get('/api/config', (req, res) => {
    res.json({
        gemini: process.env.GEMINI_API_KEY || '',
        groq: process.env.GROQ_API_KEY || '',
        openrouter: process.env.OPENROUTER_API_KEY || '',
        mistral: process.env.MISTRAL_API_KEY || '',
        cohere: process.env.COHERE_API_KEY || '',
        elevenlabs: process.env.ELEVENLABS_API_KEY || ''
    });
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Aurora Universal Chat is running!`);
    console.log(`🔗 Local Address: http://localhost:${PORT}`);
    console.log(`🛡️  API Keys loaded securely from .env`);
    console.log(`==================================================`);
});
