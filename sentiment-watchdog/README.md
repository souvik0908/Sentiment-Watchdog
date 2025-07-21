# bitbybit

**Transforming customer conversations into actionable insights.**

---

##  Features

- **Real-Time Sentiment Monitoring:** Instantly see customer sentiment from multiple channels (chat, email, phone, etc.).
- **Anomaly/Spike Detection:** Detects sudden surges in negative sentiment and triggers real-time alerts with sound and visual cues.
- **Root Cause Word Cloud:** During a spike, see a word cloud of the most common words in negative tickets to quickly identify issues.
- **AI-Powered Suggested Responses:** For negative tickets, generates an empathetic response using a free Hugging Face model.
- **Sentiment Forecast:** Predicts the next hour’s sentiment using a moving average of recent data.
- **Alert History:** Click the "Active Alerts" card to view a modal with all recent alerts and their root causes.
- **Modern, Responsive Dashboard:** Beautiful UI with dark mode, live charts, and interactive analytics.

---

##  Setup Instructions

### 1. **Clone the Repository**
```bash
git clone https://github.com/your-username/bitbybit.git
cd bitbybit/sentiment-watchdog
```

### 2. **Install Dependencies**
#### Frontend:
```bash
npm install
```
#### Backend:
```bash
cd backend
npm install
```

### 3. **Set Up Environment Variables**
- In `backend/`, create a file named `.env`:
  ```
  HUGGINGFACE_API_KEY=your_huggingface_api_key_here
  ```
- Get a free API key from [Hugging Face](https://huggingface.co/settings/tokens).

### 4. **Run the Backend**
```bash
cd backend
npm start
```
- The backend will start on [http://localhost:3001](http://localhost:3001)

### 5. **Run the Frontend**
```bash
cd .. # back to sentiment-watchdog
npm run dev
```
- The frontend will start on [http://localhost:5173](http://localhost:5173) (or similar)

---

##  Usage
- **Live Ticket Feed:** See real-time tickets and their sentiment.
- **Spike Alerts:** When a negative spike is detected, a banner and sound will alert you, and a word cloud will show the root cause.
- **Suggested Responses:** For negative tickets, see an AI-generated empathetic response.
- **Sentiment Forecast:** View a forecast of sentiment for the next hour.
- **Alert History:** Click the "Active Alerts" card to review all recent alerts and their details.

---

##  Why This 
- **Real-time, actionable insights** (not just analytics)
- **AI-powered automation** (response generation)
- **Beautiful, modern UI**
- **Proactive features** (forecast, anomaly detection)
- **Instant demo** (pre-seeded data and alerts)

---

##  Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Recharts, React Wordcloud
- **Backend:** Node.js, Express, SQLite, Hugging Face Inference API, WebSocket

---

##  Credits
- [Hugging Face](https://huggingface.co/) for free AI models
- [Lucide Icons](https://lucide.dev/), [Recharts](https://recharts.org/), [react-wordcloud](https://www.npmjs.com/package/react-wordcloud)

---

## 📣 Contact
For questions or demo requests, open an issue or contact the project maintainer. 