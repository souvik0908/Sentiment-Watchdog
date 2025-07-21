import axios from 'axios';
import db from './database.js';

const SENTIMENT_API_URL = "https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion";
const RESPONSE_GEN_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-small";

const NEGATIVE_LABELS = ['anger', 'fear', 'sadness', 'negative'];

async function generateSuggestedResponse(text) {
    const prompt = `A customer is upset and wrote the following: "${text}". 
    Write a short, empathetic response to the customer that acknowledges their problem without making specific promises.`;

    try {
        const response = await axios.post(
            RESPONSE_GEN_API_URL,
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
        );
        return response.data[0].generated_text.trim();
    } catch (error) {
        console.error("Error generating response:", error.response ? error.response.data : error.message);
        return "We're sorry to hear you're having trouble. We are looking into it."; // Fallback response
    }
}

async function analyzeAndSaveSentiment(text, channel = 'chat') {
    try {
        const sentimentResponse = await axios.post(
            SENTIMENT_API_URL,
            { inputs: text },
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
        );
        
        const sentimentData = sentimentResponse.data[0][0];
        const { label, score } = sentimentData;
        const timestamp = new Date().toISOString();
        let suggestedResponse = null;

        if (NEGATIVE_LABELS.includes(label.toLowerCase())) {
            suggestedResponse = await generateSuggestedResponse(text);
        }

        // No DB write, just return result
        return { label, score, explanation: suggestedResponse, timestamp };
    } catch (error) {
        console.error("Error querying Hugging Face API or saving to DB:", error.response ? error.response.data : error.message);
        throw new Error("Failed to process sentiment");
    }
}

export { analyzeAndSaveSentiment }; 
