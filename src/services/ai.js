// Replaced direct Gemini SDK calls with calls to our own secure backend

// Helper to convert Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Unified function to call our backend
async function callBackendAPI(payload) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Backend API Error:", error);
        return null;
    }
}

export const generateSummary = async (text) => {
    if (!text || text.length < 10) return null;

    const prompt = `Summarize the following journal entry into a single, short, evocative phrase (3-6 words). 
    Style: lowercase, no period at end, cryptic but meaningful. 
    Example: "long walk in the rain" or "coffee and quiet thoughts".
    
    Entry: "${text}"`;

    return await callBackendAPI({ prompt });
};

export const generateAudioTitle = async (audioBlob) => {
    if (!audioBlob) return null;

    const base64Data = await blobToBase64(audioBlob);

    const prompt = `Listen to this voice note and give it a short, aesthetic title (3-5 words). 
    Style: lowercase, no punctuation. 
    Example: "rainy day thoughts" or "idea for a book".`;

    return await callBackendAPI({
        prompt,
        audio: {
            data: base64Data,
            mimeType: audioBlob.type
        }
    });
};
