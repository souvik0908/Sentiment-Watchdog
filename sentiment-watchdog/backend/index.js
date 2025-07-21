import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import db, { getSentimentDistribution, getSentimentTrends, getSentimentByChannel } from './database.js';
import startLiveFeed from './liveFeed.js';
import { analyzeAndSaveSentiment } from './sentimentAnalyzer.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


app.post('/api/analyze', async (req, res) => {
    try {
        const { text, channel = 'manual' } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const sentiment = await analyzeAndSaveSentiment(text, channel);
        res.json({ ...sentiment, text, channel });
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
});


app.get('/api/tickets', (req, res) => {
    db.all("SELECT * FROM tickets ORDER BY timestamp DESC LIMIT 50", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


app.get('/api/analytics/distribution', (req, res) => {
    getSentimentDistribution((err, data) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(data);
    });
});

app.get('/api/analytics/trends', (req, res) => {
    getSentimentTrends((err, data) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(data);
    });
});

app.get('/api/analytics/channels', (req, res) => {
    getSentimentByChannel((err, data) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(data);
    });
});

const server = http.createServer(app);

startLiveFeed(server);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 