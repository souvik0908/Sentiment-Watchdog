import { WebSocketServer } from 'ws';
import { analyzeAndSaveSentiment } from './sentimentAnalyzer.js';
import db from './database.js';

const NEGATIVE_SENTIMENTS = ['anger', 'fear', 'sadness'];
let wss;
const recentSentiments = [];

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
    const allNegative = lastThree.every(sentiment => NEGATIVE_SENTIMENTS.includes(sentiment));

    if (allNegative) {
        console.log("SENTIMENT SPIKE DETECTED!");
        broadcast({ type: 'spike_alert', message: 'Negative sentiment spike detected!' });
        recentSentiments.length = 0; 
    }
}

async function simulateIncomingTicket() {
    const ticket = sampleTickets[Math.floor(Math.random() * sampleTickets.length)];
    try {
        const sentimentData = await analyzeAndSaveSentiment(ticket.text, ticket.channel);
        
        recentSentiments.push(sentimentData.label.toLowerCase());
        if(recentSentiments.length > 5) recentSentiments.shift();
        
        broadcast({ 
            type: 'new_ticket', 
            data: { 
                ...sentimentData, 
                text: ticket.text,
                channel: ticket.channel
            } 
        });

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
        db.all("SELECT * FROM tickets ORDER BY timestamp DESC LIMIT 10", (err, rows) => {
            if (!err) {
                ws.send(JSON.stringify({ type: 'history', data: rows }));
            }
        });
        ws.on('close', () => console.log('Client disconnected.'));
    });

    setInterval(simulateIncomingTicket, 8000); 
}

export default startLiveFeed; 
