import { GenerativeAI } from '@google/generative-ai';

const googleGemini = new GenerativeAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
});

async function callGoogleGemini(prompt: string) {
    try {
        const response = await googleGemini.generate({
            prompt: prompt,
            maxTokens: 150,
            temperature: 0.7,
        });
        return response.text;
    } catch (error) {
        console.error('Error calling Google Gemini API:', error);
        throw error;
    }
}

// Example usage:
// const result = await callGoogleGemini("Your prompt here");
// console.log(result);