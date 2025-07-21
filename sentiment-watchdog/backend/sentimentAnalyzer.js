import axios from 'axios';
import db from './database.js';

const API_URL = "https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion";

async function analyzeAndSaveSentiment(text, channel = 'chat') {
    try {
        const response = await axios.post(
            API_URL,
            { inputs: text },
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
        );
        
        const sentimentData = response.data[0][0];
        const timestamp = new Date().toISOString();
        
        const stmt = db.prepare("INSERT INTO tickets (text, sentiment, score, channel, timestamp) VALUES (?, ?, ?, ?, ?)");
        stmt.run(text, sentimentData.label, sentimentData.score, channel, timestamp);
        stmt.finalize();

        return { ...sentimentData, timestamp };
    } catch (error) {
        console.error("Error querying Hugging Face API or saving to DB:", error.response ? error.response.data : error.message);
        throw new Error("Failed to process sentiment");
    }
}

export { analyzeAndSaveSentiment }; 
