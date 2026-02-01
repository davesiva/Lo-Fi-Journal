// Utility to fetch and cache daily journal prompts

const STORAGE_KEY_PREFIX = 'lofi_daily_prompts_';

/**
 * Gets the daily prompts, either from local cache or by generating new ones.
 * @returns {Promise<{grounded: string, wildcard: string}>}
 */
export const getDailyPrompts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `${STORAGE_KEY_PREFIX}${today}`;

    // 1. Check local storage
    try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error("Error reading from localStorage:", e);
    }

    // 2. If not found, generate via API
    try {
        console.log("Fetching new daily journal prompts...");
        const systemPrompt = `Generate 2 distinct 'Grounded' journal prompts for today. 
Both should be simple, check-in style, or gratitude-focused. Avoid random/wildcard hypothetical questions.
Keep them under 20 words. Tone: warm, vintage, lo-fi, relaxed.
Output strictly as a JSON object with keys 'option1' and 'option2'. Do not include markdown formatting like \`\`\`json.`;

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: systemPrompt
            }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let text = data.text;

        // Cleanup potential markdown code blocks if the LLM ignores instructions
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const prompts = JSON.parse(text);

        // Validate structure
        if (!prompts.option1 || !prompts.option2) {
            // Fallback if parsing fails or structure is wrong
            return {
                option1: "What is one small thing you are grateful for today?",
                option2: "How is your heart feeling right this moment?"
            };
        }

        // 3. Cache the result
        try {
            localStorage.setItem(storageKey, JSON.stringify(prompts));
        } catch (e) {
            console.warn("Failed to cache prompts:", e);
        }

        return prompts;

    } catch (error) {
        console.error("Failed to generate daily prompts:", error);
        // Return safe fallbacks so the UI doesn't break
        return {
            option1: "How are you feeling right now, really?",
            option2: "What is bringing you peace today?"
        };
    }
};
