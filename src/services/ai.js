import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

// Helper to convert Blob to Base64 for Gemini
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
}

export const generateSummary = async (text) => {
    if (!genAI) {
        console.warn("Gemini API Key is missing");
        return null;
    }

    if (!text || text.length < 10) return null; // Too short to summarize

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Prompt engineered for the app's aesthetic
        const prompt = `Summarize the following journal entry into a single, short, evocative phrase (3-6 words). 
        Style: lowercase, no period at end, cryptic but meaningful. 
        Example: "long walk in the rain" or "coffee and quiet thoughts".
        
        Entry: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw error;
    }
};

export const generateAudioTitle = async (audioBlob) => {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const audioPart = await fileToGenerativePart(audioBlob);

        const prompt = `Listen to this voice note and give it a short, aesthetic title (3-5 words). 
        Style: lowercase, no punctuation. 
        Example: "rainy day thoughts" or "idea for a book".`;

        const result = await model.generateContent([prompt, audioPart]);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Audio Error:", error);
        return "voice note"; // Fallback
    }
};
