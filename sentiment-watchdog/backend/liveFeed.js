import { WebSocketServer } from 'ws';
import { analyzeAndSaveSentiment } from './sentimentAnalyzer.js';
import db from './database.js';

// Remove all DB usage, use only in-memory for demo
const NEGATIVE_SENTIMENTS = ['anger', 'fear', 'sadness', 'negative'];
let wss;
const recentSentiments = [];
const liveTickets = [];

const channels = ['chat', 'email', 'phone', 'social'];

const sampleTickets = [
    { text: "I am absolutely furious with the terrible customer service I received!", channel: "chat" },
    { text: "Thank you so much for your help, you've been wonderful!", channel: "email" },
    { text: "I'm a bit confused about the new update, can someone clarify?", channel: "chat" },
    { text: "This is the best product I have ever used, I'm so happy!", channel: "social" },
    { text: "I'm scared my account has been compromised, please help me.", channel: "email" },
    { text: "I've been on hold for an hour, this is unacceptable!", channel: "phone" },
    { text: "Just wanted to say your team is doing a fantastic job.", channel: "social" },
    { text: "It's a sad day, my favorite feature was removed.", channel: "chat" },
];

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { 
            client.send(JSON.stringify(data));
        }
    });
}

function checkForSpike() {
    if (recentSentiments.length < 3) return;
    const lastThree = recentSentiments.slice(-3);
    const allNegative = lastThree.every(sentiment => NEGATIVE_SENTIMENTS.includes(sentiment.label));
    if (allNegative) {
        console.log("SENTIMENT SPIKE DETECTED!");
        const spikeText = lastThree.map(s => s.text).join(' ');
        broadcast({ 
            type: 'spike_alert', 
            message: 'High volume of negative sentiment detected!',
            text: spikeText 
        });
        recentSentiments.length = 0; // Reset after alert
    }
}

async function simulateIncomingTicket() {
    const ticket = sampleTickets[Math.floor(Math.random() * sampleTickets.length)];
    try {
        const sentimentData = await analyzeAndSaveSentiment(ticket.text, ticket.channel);
        // Add to recent sentiments for spike detection
        recentSentiments.push({ label: sentimentData.label.toLowerCase(), text: ticket.text });
        if(recentSentiments.length > 5) recentSentiments.shift();
        // Add to in-memory live tickets
        liveTickets.push({ ...sentimentData, text: ticket.text, channel: ticket.channel });
        if(liveTickets.length > 50) liveTickets.shift();
        // Broadcast the new ticket to all connected clients
        broadcast({ 
            type: 'new_ticket', 
            data: { 
                ...sentimentData, 
                text: ticket.text,
                channel: ticket.channel
            } 
        });
        // Check for negative sentiment spike
        checkForSpike();
    } catch (error) {
        console.error('Error in simulation:', error);
    }
}

function startLiveFeed(server) {
    wss = new WebSocketServer({ server });
    console.log('WebSocket server started.');
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket.');
        // Send last 10 tickets from memory
        ws.send(JSON.stringify({ type: 'history', data: liveTickets.slice(-10) }));
        ws.on('close', () => console.log('Client disconnected.'));
    });
    setInterval(simulateIncomingTicket, 8000);
}

export default startLiveFeed; 
