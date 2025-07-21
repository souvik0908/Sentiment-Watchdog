import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./sentiment.db', (err) => {
    if (err) {
        console.error("Error opening database", err.message);
    } else {
        console.log("Database connected successfully.");

        db.run(`DROP TABLE IF EXISTS tickets`, (err) => {
            if (err) {
                console.error("Error dropping table", err.message);
            } else {
                db.run(`CREATE TABLE tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    sentiment TEXT NOT NULL,
                    score REAL NOT NULL,
                    channel TEXT DEFAULT 'chat',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        console.error("Error creating table", err.message);
                    } else {
                        console.log("Table 'tickets' is ready with channel field.");
                    }
                });
            }
        });
    }
});


const getSentimentDistribution = (callback) => {
    const query = `
        SELECT 
            sentiment,
            COUNT(*) as count,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets)) as percentage
        FROM tickets
        GROUP BY sentiment
    `;
    db.all(query, [], callback);
};


const getSentimentTrends = (callback) => {
    const query = `
        SELECT 
            strftime('%H:00', timestamp) as hour,
            sentiment,
            COUNT(*) as count
        FROM tickets
        WHERE timestamp >= datetime('now', '-24 hours')
        GROUP BY hour, sentiment
        ORDER BY hour
    `;
    db.all(query, [], callback);
};


const getSentimentByChannel = (callback) => {
    const query = `
        SELECT 
            channel,
            sentiment,
            COUNT(*) as count
        FROM tickets
        GROUP BY channel, sentiment
    `;
    db.all(query, [], callback);
};

export { 
    db as default,
    getSentimentDistribution,
    getSentimentTrends,
    getSentimentByChannel
}; 