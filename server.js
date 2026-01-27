import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for audio files

// Initialize Gemini
const API_KEY = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// API Route: Generate Content
app.post('/api/generate', async (req, res) => {
    console.log("Received API Request");
    if (!genAI) {
        console.error("Server missing API Key during request");
        return res.status(500).json({ error: "Server missing API Key" });
    }

    try {
        const { prompt, audio } = req.body;
        console.log("Processing prompt:", prompt.substring(0, 50) + "...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let result;
        if (audio) {
            console.log("Processing Audio...");
            // Processing audio
            // audio input expects: { inlineData: { data: "base64...", mimeType: "..." } }
            // The frontend sends the full part object, or we can construct it here.
            // Let's assume frontend sends { data: "base64", mimeType: "..." }
            const audioPart = {
                inlineData: {
                    data: audio.data,
                    mimeType: audio.mimeType
                }
            };
            result = await model.generateContent([prompt, audioPart]);
        } else {
            // Processing text
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        const text = response.text().trim();
        console.log("Generated:", text);
        res.json({ text });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate content" });
    }
});

// Serve Static Files (The React App)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath));

// Catch-all route for SPA (React Router)
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
