import React, { useState, useEffect, useRef } from 'react';
import WordCloud from 'react-wordcloud';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, MessageSquare, Activity, Bell, Sun, Moon, X, Menu } from 'lucide-react';
import './SentimentWatchdog.css';
import alertSound from './assets/alert.mp3'; // Import the sound file
import { BarChart as RCBarChart, Bar as RCBar, XAxis as RCXAxis, YAxis as RCYAxis, Tooltip as RCTooltip, ResponsiveContainer as RCResponsiveContainer } from 'recharts';

const SentimentWatchdog = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [liveTickets, setLiveTickets] = useState([]);
  const [alert, setAlert] = useState(null);
  const [spikeWords, setSpikeWords] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const audioRef = useRef(null);
  const [sentimentTrends, setSentimentTrends] = useState([
    { time: '00:00', joy: 5, sadness: 2, anger: 1 },
    { time: '04:00', joy: 8, sadness: 3, anger: 2 },
    { time: '08:00', joy: 4, sadness: 6, anger: 4 },
    { time: '12:00', joy: 7, sadness: 2, anger: 1 },
    { time: '16:00', joy: 6, sadness: 4, anger: 3 },
    { time: '20:00', joy: 9, sadness: 1, anger: 1 }
  ]);
  const [channelData, setChannelData] = useState([
    { channel: 'Email', joy: 12, sadness: 8, anger: 4 },
    { channel: 'Chat', joy: 15, sadness: 6, anger: 5 },
    { channel: 'Phone', joy: 10, sadness: 4, anger: 2 },
    { channel: 'Social', joy: 8, sadness: 3, anger: 3 }
  ]);
  const [sentimentDistribution, setSentimentDistribution] = useState([
    { name: 'Joy', value: 55, color: 'var(--color-positive)' },
    { name: 'Sadness', value: 30, color: 'var(--color-negative)' },
    { name: 'Anger', value: 15, color: 'var(--color-warning)' }
  ]);
  const [chatText, setChatText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  
  const [totalInteractions, setTotalInteractions] = useState(1247);
  const [positivePercentage, setPositivePercentage] = useState(55);
  const [negativePercentage, setNegativePercentage] = useState(15);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [forecastData, setForecastData] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('Home');
  const [techTab, setTechTab] = useState('Product Update Summary');

  const [signup, setSignup] = useState({ firstName: '', lastName: '', email: '', age: '', gender: '', organization: '' });
  const [signupSuccess, setSignupSuccess] = useState(false);
  function handleSignupSubmit(e) { e.preventDefault(); setSignup({ firstName: '', lastName: '', email: '', age: '', gender: '', organization: '' }); setSignupSuccess(true); setTimeout(() => setSignupSuccess(false), 4000); }

  // Add random forecast data for demo
  useEffect(() => {
    function randomForecast() {
      const sentiments = ['joy', 'sadness', 'anger', 'fear', 'love', 'neutral'];
      return sentiments.map(sentiment => ({
        sentiment,
        forecast: Math.floor(Math.random() * 20) + 5
      }));
    }
    setForecastData(randomForecast());
  }, [activePage]);

  useEffect(() => {
    const body = document.body;
    if (isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const fetchAnalytics = async () => {
    try {
      const [trendsRes, channelsRes, distributionRes] = await Promise.all([
        fetch('http://localhost:3001/api/analytics/trends'),
        fetch('http://localhost:3001/api/analytics/channels'),
        fetch('http://localhost:3001/api/analytics/distribution')
      ]);

      const trends = await trendsRes.json();
      const channels = await channelsRes.json();
      const distribution = await distributionRes.json();

      const processedTrends = trends.reduce((acc, curr) => {
        const existing = acc.find(item => item.time === curr.hour);
        if (existing) {
          existing[curr.sentiment.toLowerCase()] = curr.count;
        } else {
          acc.push({
            time: curr.hour,
            [curr.sentiment.toLowerCase()]: curr.count
          });
        }
        return acc;
      }, []);
      setSentimentTrends(processedTrends);

      const processedChannels = channels.reduce((acc, curr) => {
        const existing = acc.find(item => item.channel === curr.channel);
        if (existing) {
          existing[curr.sentiment.toLowerCase()] = curr.count;
        } else {
          acc.push({
            channel: curr.channel,
            [curr.sentiment.toLowerCase()]: curr.count
          });
        }
        return acc;
      }, []);
      setChannelData(processedChannels);

      const processedDistribution = distribution.map(item => ({
        name: item.sentiment,
        value: item.percentage,
        color: getSentimentColor(item.sentiment)
      }));
      setSentimentDistribution(processedDistribution);

      const forecastRes = await fetch('http://localhost:3001/api/analytics/forecast');
      const forecast = await forecastRes.json();
      setForecastData(forecast);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getSentimentColor = (sentiment) => {
    const s = sentiment.toLowerCase();
    switch (s) {
      case 'joy':
      case 'love':
        return 'var(--color-positive)';
      case 'anger':
      case 'fear':
      case 'sadness':
        return 'var(--color-negative)';
      default:
        return 'var(--color-neutral)';
    }
  };

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      let updatedTickets;
      if (message.type === 'new_ticket') {
        setLiveTickets(prevTickets => {
          updatedTickets = [...prevTickets, message.data];
          updateStats(updatedTickets);
          return updatedTickets;
        });
        updateChartsWithNewSentiment(message.data.label);
      } else if (message.type === 'history') {
        setLiveTickets(message.data);
        updateStats(message.data);
      } else if (message.type === 'spike_alert') {
        const newAlert = {
            id: Date.now(),
            message: message.message,
            words: message.text.toLowerCase().split(/\s+/).filter(word => word.length > 3 && !['this', 'that', 'with', 'your', 'just'].includes(word)),
        };

        setAlert(newAlert.message);
        setAlertHistory(prev => [newAlert, ...prev]);

        const wordCounts = newAlert.words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        setSpikeWords(Object.entries(wordCounts).map(([text, value]) => ({ text, value })));

        setActiveAlerts(prev => prev + 1);
        if (audioRef.current) {
            audioRef.current.play();
        }
        setTimeout(() => setAlert(null), 5000);
      } else if (message.type === 'forecast') {
        // Handle live forecast updates from backend
        // message.data: { forecast, details }
        // Convert details to chart data format
        const details = message.data.details || {};
        const chartData = Object.entries(details).map(([sentiment, value]) => ({ sentiment, forecast: value }));
        setForecastData(chartData);
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => {
      ws.close();
    };
  }, []);

  const updateStats = (tickets) => {
    setTotalInteractions(tickets.length);
    
    const positiveSentiments = ['joy', 'love'];
    const negativeSentiments = ['anger', 'fear', 'sadness'];
    
    const positiveCount = tickets.filter(t => positiveSentiments.includes(t.sentiment || t.label)).length;
    const negativeCount = tickets.filter(t => negativeSentiments.includes(t.sentiment || t.label)).length;
    
    setPositivePercentage(tickets.length > 0 ? Math.round((positiveCount / tickets.length) * 100) : 0);
    setNegativePercentage(tickets.length > 0 ? Math.round((negativeCount / tickets.length) * 100) : 0);
  };
  
  const getSentimentClass = (sentiment) => {
    const s = sentiment.toLowerCase();
    switch (s) {
      case 'positive':
      case 'joy':
      case 'love':
        return 'sentiment-positive';
      case 'negative':
      case 'anger':
      case 'fear':
      case 'sadness':
        return 'sentiment-negative';
      default:
        return 'sentiment-neutral';
    }
  };

  const getSentimentLabel = (label) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === 'label_2') return 'Positive';
    if (lowerLabel === 'label_0') return 'Negative';
    if (lowerLabel === 'label_1') return 'Neutral';
    return label;
  };

  const handleAnalysis = async () => {
    if (!analysisText.trim()) {
      alert('Please enter some text to analyze.');
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: analysisText }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setAnalysisResult(data.sentiment[0][0]); 
    } catch (error) {
      console.error("Failed to fetch sentiment:", error);
      alert('Failed to analyze sentiment. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAnalysis = async () => {
    if (!chatText.trim()) {
      alert('Please enter some text to analyze.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: chatText, channel: 'manual' }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setLiveTickets(prevTickets => {
        const updatedTickets = [...prevTickets, data];
        updateStats(updatedTickets);
        return updatedTickets;
      });

      setLastAnalysis(data);
      setChatText('');
      
      updateChartsWithNewSentiment(data.label);
      
    } catch (error) {
      console.error("Failed to analyze sentiment:", error);
      alert('Failed to analyze sentiment. Is the backend server running?');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateChartsWithNewSentiment = (sentiment) => {
    const lowerSentiment = sentiment.toLowerCase();
    
    setSentimentDistribution(prev => {
      const updated = [...prev];
      const index = updated.findIndex(item => item.name.toLowerCase() === sentiment.toLowerCase());
      if (index !== -1) {
        updated[index] = { ...updated[index], value: updated[index].value + 1 };
      }
      return updated;
    });

    setSentimentTrends(prev => {
      const updated = [...prev];
      const lowerSentiment = sentiment.toLowerCase();
      const currentHour = new Date().getHours().toString().padStart(2, '0') + ':00';
      
      const hourIndex = updated.findIndex(item => item.time === currentHour);

      if (hourIndex > -1) {
        const newEntry = {
          ...updated[hourIndex],
          [lowerSentiment]: (updated[hourIndex][lowerSentiment] || 0) + 1,
        };
        updated[hourIndex] = newEntry;
      } else {
        const newEntry = {
          time: currentHour,
          joy: 0,
          sadness: 0,
          anger: 0,
          [lowerSentiment]: 1,
        };
        updated.push(newEntry);
      }

      updated.sort((a, b) => a.time.localeCompare(b.time));

      return updated;
    });

    setChannelData(prev => {
      const updated = [...prev];
      const chatIndex = updated.findIndex(item => item.channel === 'Chat');
      if (chatIndex !== -1) {
        updated[chatIndex] = {
          ...updated[chatIndex],
          [lowerSentiment]: (updated[chatIndex][lowerSentiment] || 0) + 1
        };
      }
      return updated;
    });
  };

  return (
    <div className="dashboard-container">
      {/* Hamburger Menu and Sidebar */}
      <div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ position: 'fixed', top: 24, left: 24, zIndex: 1100, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Menu size={32} />
        </button>
        <div className={`sidebar-menu${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
        <nav className={`sidebar${menuOpen ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
          <button className="close-sidebar-btn" onClick={() => setMenuOpen(false)}>&times;</button>
          <ul>
            {['Home', 'Dashboard', 'Sign up'].map(page => (
              <li
                key={page}
                className={`sidebar-link${activePage === page ? ' active' : ''}`}
                onClick={() => { setActivePage(page); setMenuOpen(false); }}
              >
                {page}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="dashboard-content">
        {/* Spike Alert Banner (always at top, never overlays full screen) */}
        {alert && (
          <div className="spike-alert">
            <div className="alert-content">
              <AlertTriangle /> {alert}
            </div>
            <button onClick={() => setAlert(null)} className="close-alert-btn">&times;</button>
          </div>
        )}
        {/* Render page content based on activePage */}
        {activePage === 'Home' && (
          <>
            {/* Header */}
            <header className="header">
              <div className="header-main">
                <div className="logo-container">
                  <Activity className="logo-icon" />
                </div>
                <div>
                  <h1 className="header-title">bitbybit</h1>
                  <p className="header-subtitle">
                    Transforming customer conversations into actionable insights.
                  </p>
                </div>
              </div>
              <div className="header-controls">
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  Live
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="theme-toggle-btn"
                  title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                >
                  {isDarkMode ? <Sun /> : <Moon />}
                </button>
              </div>
            </header>
            {/* Impressive Model Description */}
            <section className="card" style={{ marginBottom: '2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '0.01em' }}>About Our Sentiment Analysis Model</h2>
              <ul style={{ textAlign: 'left', lineHeight: 2, marginBottom: '2rem', paddingLeft: '1.5rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>State-of-the-Art AI Foundation:</b> Built on advanced transformer architectures, fine-tuned with millions of real-world conversations, reviews, and support tickets. Accurately detects not only basic sentiments (<b>positive</b>, <b>negative</b>, <b>neutral</b>) but also nuanced emotions such as <b>anger</b>, <b>fear</b>, <b>sadness</b>, <b>joy</b>, and <b>love</b>.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Deep Contextual Understanding:</b> Incorporates attention mechanisms and contextual embeddings to understand the meaning of each word in relation to the entire sentence. Excels at detecting <b>context</b>, <b>sarcasm</b>, and subtle shifts in tone—capabilities that traditional sentiment tools often miss. Especially effective in customer support scenarios, where a single word can change the entire sentiment.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Robust, Real-Time Data Pipeline:</b> Ingests live data streams from <b>chat</b>, <b>email</b>, <b>phone transcripts</b>, and <b>social media</b>. Preprocesses messages to remove noise, handle misspellings, and normalize language, ensuring robustness to informal and varied communication styles.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Multi-Label Sentiment & Emotion Detection:</b> Outputs a probability distribution over multiple sentiment and emotion categories for each message. Identifies <b>primary</b> and <b>secondary emotions</b>, enabling detection of mixed feelings or uncertainty.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Actionable Recommendations:</b> Automatically generates <b>empathetic</b>, context-aware response suggestions for negative or emotionally charged messages using a large language model. Empowers support agents to respond more effectively and ensures a consistent, compassionate customer experience.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Enterprise-Grade Scalability & Speed:</b> Processes <b>thousands of messages per second</b> with minimal latency, thanks to optimized inference engines and batching techniques. Continuously updated with new data to adapt to emerging trends, slang, and evolving customer expectations.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Comprehensive Analytics & Forecasting:</b> Aggregates sentiment trends over time to identify root causes of dissatisfaction and predict potential crises. Employs <b>time-series analysis</b> and <b>machine learning</b> to forecast sentiment shifts, enabling proactive business decisions.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Security, Privacy, and Compliance:</b> All data is anonymized and processed in compliance with <b>GDPR</b>, <b>CCPA</b>, and other industry standards. Flexible deployment options: on-premises, cloud, or hybrid, giving organizations full control over their data.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Proven Performance & Multilingual Support:</b> Outperforms traditional sentiment analysis methods in both accuracy and robustness, as validated by industry benchmarks. Supports over <b>20 languages and dialects</b>, and can be customized for domain-specific vocabularies.</span></li>
                <li style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><span style={{ color: 'var(--color-accent)', fontSize: '1.3em', marginTop: '0.1em' }}>✔️</span> <span><b style={{ color: 'var(--color-accent)' }}>Strategic Business Impact:</b> Transforms raw customer conversations into actionable, strategic insights. Enhances customer satisfaction, drives loyalty, and supports operational excellence for organizations of any size.</span></li>
              </ul>
              <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-accent)', margin: 0 }}>
                Experience the future of customer sentiment analysis—where every conversation counts, and every emotion is understood.
              </p>
            </section>
            {/* Live Chat Demo */}
            <section className="live-chat-section">
              <div className="card">
                <h3 className="panel-title">Live Chat Demo</h3>
                <div className="chat-input-area">
                  <textarea
                    className="chat-textarea"
                    placeholder="Type a message to test sentiment analysis..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    disabled={isAnalyzing}
                  />
                  <button
                    className="chat-button"
                    onClick={handleManualAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Send & Analyze'}
                  </button>
                </div>
                {lastAnalysis && (
                  <div className={`analysis-result ${getSentimentClass(lastAnalysis.label)}`}>
                    <p>Analysis Result:</p>
                    <p>Sentiment: <strong>{lastAnalysis.label}</strong></p>
                    <p>Confidence: <strong>{(lastAnalysis.score * 100).toFixed(2)}%</strong></p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        {activePage === 'Dashboard' && (
          <>
            {/* Executive Summary Card */}
            <section className="card" style={{ marginBottom: '2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)', border: '1px solid #e5e7eb', background: 'linear-gradient(90deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '2.2rem', color: '#3b82f6' }}>📊</span>
                <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0, color: '#222' }}>Executive Summary</h2>
              </div>
              <ul style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#374151', marginLeft: '1.5rem', marginBottom: 0 }}>
                <li style={{ marginBottom: '0.7rem' }}><b>AI-powered platform</b> delivering real-time, actionable insights from customer conversations across all digital channels.</li>
                <li style={{ marginBottom: '0.7rem' }}><b>Proactive sentiment monitoring</b> and <b>anomaly detection</b> help organizations address issues before they escalate.</li>
                <li style={{ marginBottom: '0.7rem' }}><b>Empathetic, AI-generated responses</b> empower support teams to resolve issues faster and more effectively.</li>
                <li style={{ marginBottom: '0.7rem' }}><b>Enterprise-ready</b> with robust security, compliance, and scalability for global deployments.</li>
                <li><b>Modern, intuitive dashboard</b> with live analytics, forecasting, and actionable business intelligence.</li>
              </ul>
            </section>
            {/* Key Metrics Card */}
            <section className="card" style={{ marginBottom: '2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)', border: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.5rem', color: '#222' }}>Key Metrics</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', color: '#3b82f6' }}>💬</span>
                  <span style={{ fontWeight: 800, fontSize: '2rem', color: '#222' }}>12,450</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>Conversations Analyzed</span>
                </div>
                <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', color: '#10b981' }}>📈</span>
                  <span style={{ fontWeight: 800, fontSize: '2rem', color: '#222' }}>98.7%</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>Sentiment Accuracy</span>
                </div>
                <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', color: '#f59e0b' }}>⚡</span>
                  <span style={{ fontWeight: 800, fontSize: '2rem', color: '#222' }}>0.8s</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>Avg. Response Time</span>
                </div>
                <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', color: '#ef4444' }}>🚨</span>
                  <span style={{ fontWeight: 800, fontSize: '2rem', color: '#222' }}>37</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>Spike Alerts Resolved</span>
                </div>
                <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', color: '#6366f1' }}>🌎</span>
                  <span style={{ fontWeight: 800, fontSize: '2rem', color: '#222' }}>22</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>Languages Supported</span>
                </div>
              </div>
            </section>
            {/* All dashboard/statistics/charts content moved here */}
            <section className="stats-grid">
              <div className="card">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-title">Total Interactions</p>
                    <p className="stat-card-value">{totalInteractions}</p>
                  </div>
                  <MessageSquare size={32} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="stat-card-trend" style={{ color: 'var(--color-positive)' }}>
                  <TrendingUp size={16} />
                  <span style={{ marginLeft: '0.25rem' }}>+12% from yesterday</span>
                </div>
              </div>
              <div className="card">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-title">Positive Sentiment</p>
                    <p className="stat-card-value" style={{ color: 'var(--color-positive)' }}>{positivePercentage}%</p>
                  </div>
                  <TrendingUp size={32} style={{ color: 'var(--color-positive)' }} />
                </div>
              </div>
              <div className="card">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-title">Negative Sentiment</p>
                    <p className="stat-card-value" style={{ color: 'var(--color-negative)' }}>{negativePercentage}%</p>
                  </div>
                  <TrendingDown size={32} style={{ color: 'var(--color-negative)' }} />
                </div>
              </div>
              <div className="card">
                <div className="stat-card-header">
                  <div>
                    <p className="stat-card-title">Active Alerts</p>
                    <p className="stat-card-value" style={{ color: 'var(--color-warning)' }}>{activeAlerts}</p>
                  </div>
                  <Bell size={32} style={{ color: 'var(--color-warning)' }} />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="stat-card-button">
                  View Alerts
                </button>
              </div>
            </section>
            {isModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Alert History</h2>
                    <button onClick={() => setIsModalOpen(false)} className="close-alert-btn"><X size={24} /></button>
                  </div>
                  <div className="modal-body">
                    {alertHistory.length > 0 ? (
                      alertHistory.map(item => (
                        <div key={item.id} className="alert-history-item">
                          <p><strong>{item.message}</strong></p>
                          <p>
                            {item.words.slice(0, 15).join(', ')}...
                          </p>
                          <span className="alert-timestamp">{new Date(item.id).toLocaleTimeString()}</span>
                        </div>
                      ))
                    ) : (
                      <p>No alerts in this session.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Charts Grid */}
            <section className="charts-grid">
              <div className="card">
                <h3 className="panel-title">Sentiment Trends (24h)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sentimentTrends} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}/>
                    <Line type="monotone" dataKey="joy" name="Joy" stroke="var(--color-positive)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sadness" name="Sadness" stroke="var(--color-negative)" strokeWidth={2} />
                    <Line type="monotone" dataKey="anger" name="Anger" stroke="var(--color-warning)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="panel-title">Sentiment by Channel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="channel" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}/>
                    <Bar dataKey="joy" name="Joy" stackId="a" fill="var(--color-positive)" />
                    <Bar dataKey="sadness" name="Sadness" stackId="a" fill="var(--color-negative)" />
                    <Bar dataKey="anger" name="Anger" stackId="a" fill="var(--color-warning)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="charts-grid">
              <div className="card">
                <h3 className="panel-title">Sentiment Forecast (Next Hour)</h3>
                <RCResponsiveContainer width="100%" height={300}>
                  <RCBarChart data={forecastData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <RCXAxis dataKey="sentiment" stroke="var(--text-secondary)" />
                    <RCYAxis stroke="var(--text-secondary)" />
                    <RCTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}/>
                    <RCBar dataKey="forecast" name="Forecast" fill="var(--color-accent)" />
                  </RCBarChart>
                </RCResponsiveContainer>
              </div>
            </section>
            <section className="feed-grid">
              <div className="card">
                <div className="panel-header">
                  <h3 className="panel-title">Live Ticket Feed</h3>
                </div>
                <div className="panel-scroll-content">
                  {liveTickets.map((ticket, index) => (
                    <div key={index} className="ticket-item">
                      <div className="ticket-header">
                        <span className={`sentiment-badge ${getSentimentClass(ticket.sentiment || ticket.label)}`}>
                          {ticket.sentiment || ticket.label}
                        </span>
                      </div>
                      <p className="ticket-subject">{ticket.text}</p>
                      <div className="ticket-meta">
                        <span>Confidence: {(ticket.score * 100).toFixed(0)}%</span>
                        <span>{new Date(ticket.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {ticket.explanation && (
                        <p className="ticket-explanation">
                          <strong>Suggested Response:</strong> {ticket.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="panel-title">Overall Sentiment</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sentimentDistribution.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
            {/* Tech Corp Analysis Card */}
            <section className="card" style={{ marginBottom: '2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.2rem' }}>Tech Corp Analysis</h3>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.2rem' }}>
                <button
                  style={{ background: techTab === 'Product Update Summary' ? '#f3f4f6' : 'none', border: 'none', borderRadius: '1.5rem', padding: '0.5rem 1.5rem', fontWeight: 600, color: techTab === 'Product Update Summary' ? '#222' : '#888', boxShadow: 'none', outline: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                  onClick={() => setTechTab('Product Update Summary')}
                >Product Update Summary</button>
                <button
                  style={{ background: techTab === 'Business Analysis' ? '#f3f4f6' : 'none', border: 'none', borderRadius: '1.5rem', padding: '0.5rem 1.5rem', fontWeight: 600, color: techTab === 'Business Analysis' ? '#222' : '#888', boxShadow: 'none', outline: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                  onClick={() => setTechTab('Business Analysis')}
                >Business Analysis</button>
              </div>
              {techTab === 'Product Update Summary' && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ background: '#e5edfa', color: '#3b82f6', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>Enterprise grade security with SSO and MFA</div>
                  <div style={{ background: '#e5edfa', color: '#3b82f6', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>API-first architecture with comprehensive developer tools</div>
                  <div style={{ background: '#e5edfa', color: '#3b82f6', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>White-label solutions for enterprise partners</div>
                  <div style={{ background: '#e5edfa', color: '#3b82f6', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>Mobile-responsive design with offline capabilities</div>
                </div>
              )}
              {techTab === 'Business Analysis' && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ background: '#e0f2fe', color: '#0ea5e9', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>Strong year-over-year revenue growth</div>
                  <div style={{ background: '#e0f2fe', color: '#0ea5e9', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>Expanding enterprise client base</div>
                  <div style={{ background: '#e0f2fe', color: '#0ea5e9', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>Increased R&D investment in AI/ML</div>
                  <div style={{ background: '#e0f2fe', color: '#0ea5e9', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, width: 'fit-content' }}>Strategic partnerships with cloud providers</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h4 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.7rem' }}>Threats</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Increasing competition from tech giants (Google, Microsoft, AWS)</div>
                    <div style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Seasonal downturn affecting enterprise software spending</div>
                    <div style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Data privacy regulations impacting API integrations</div>
                    <div style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Potential market saturation in core verticals</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h4 style={{ color: '#2563eb', fontWeight: 700, marginBottom: '0.7rem' }}>Opportunities</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ background: '#e5edfa', color: '#2563eb', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Expansion into international markets (Asia Pacific, Europe)</div>
                    <div style={{ background: '#e5edfa', color: '#2563eb', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>AI-powered features for emerging use cases (sustainability, ESG)</div>
                    <div style={{ background: '#e5edfa', color: '#2563eb', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Acquisition of complementary technologies or companies</div>
                    <div style={{ background: '#e5edfa', color: '#2563eb', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Partnership opportunities with major cloud providers</div>
                    <div style={{ background: '#e5edfa', color: '#2563eb', borderRadius: '1.5rem', padding: '0.5rem 1.2rem', fontWeight: 500 }}>Development of industry-specific solutions and verticals</div>
                  </div>
                </div>
              </div>
            </section>
            {/* Predicted Trends Card */}
            <section className="card" style={{ marginBottom: '2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.2rem' }}>Predicted Trends</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {/* Left Side */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>Update Frequency<br /><span style={{ fontWeight: 400, color: '#222' }}>15 days</span></div>
                    <div style={{ fontWeight: 600, color: '#f59e0b' }}>Next Update<br /><span style={{ fontWeight: 400, color: '#222' }}>24% Probability</span></div>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '0.7rem' }}>Top Predictions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span role="img" aria-label="ai" style={{ fontSize: '1.2em' }}>🤖</span>
                      <span style={{ flex: 1 }}>New AI-powered features and intelligent automation</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>97% confidence</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span role="img" aria-label="security" style={{ fontSize: '1.2em' }}>🔒</span>
                      <span style={{ flex: 1 }}>Advanced security features and compliance updates</span>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>88% confidence</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span role="img" aria-label="mobile" style={{ fontSize: '1.2em' }}>📱</span>
                      <span style={{ flex: 1 }}>Mobile app enhancements and cross-platform improvements</span>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>79% confidence</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span role="img" aria-label="ml" style={{ fontSize: '1.2em' }}>🧠</span>
                      <span style={{ flex: 1 }}>Advanced AI capabilities and machine learning integrations</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>75% confidence</span>
                    </div>
                  </div>
                  {/* Static bar chart */}
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Update Frequency (6 months)</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 60 }}>
                      {[20, 35, 30, 40, 25, 15].map((val, i) => (
                        <div key={i} style={{ width: 18, height: val, background: '#3b82f6', borderRadius: 4 }}></div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Right Side */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>Update Frequency<br /><span style={{ fontWeight: 400, color: '#222' }}>15 days</span></div>
                    <div style={{ fontWeight: 600, color: '#f59e0b' }}>Next Update<br /><span style={{ fontWeight: 400, color: '#222' }}>20% Probability</span></div>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '0.7rem' }}>Top Predictions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span role="img" aria-label="performance" style={{ fontSize: '1.2em' }}>⚡</span>
                      <span style={{ flex: 1 }}>Significant performance optimizations and speed improvements</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>90% confidence</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span role="img" aria-label="security" style={{ fontSize: '1.2em' }}>🔒</span>
                      <span style={{ flex: 1 }}>Advanced security features and compliance updates</span>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>86% confidence</span>
                    </div>
                  </div>
                  {/* Static pie/donut chart */}
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Focus Areas</div>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'conic-gradient(#3b82f6 0% 40%, #f59e0b 40% 70%, #10b981 70% 100%)', margin: '0 auto', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontWeight: 700, color: '#222', fontSize: '1.1rem' }}>AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        {activePage === 'Sign up' && (
          <div style={{ padding: '2rem', maxWidth: 500, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: '1.5rem' }}>Sign Up</h2>
            {signupSuccess ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', fontSize: '1.2rem', color: 'var(--color-positive)' }}>
                <b>Sign up successful!</b><br />Thank you for registering.
              </div>
            ) : (
              <form className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem 1.5rem', alignItems: 'center' }} onSubmit={handleSignupSubmit} autoComplete="off">
                <label style={{ gridColumn: '1/2' }}>First Name
                  <input type="text" className="chat-textarea" placeholder="Enter your first name" value={signup.firstName} onChange={e => setSignup({ ...signup, firstName: e.target.value })} required />
                </label>
                <label style={{ gridColumn: '2/3' }}>Last Name
                  <input type="text" className="chat-textarea" placeholder="Enter your last name" value={signup.lastName} onChange={e => setSignup({ ...signup, lastName: e.target.value })} required />
                </label>
                <label style={{ gridColumn: '1/3' }}>Email Address
                  <input type="email" className="chat-textarea" placeholder="Enter your email address" value={signup.email} onChange={e => setSignup({ ...signup, email: e.target.value })} required />
                </label>
                <label style={{ gridColumn: '1/2' }}>Age
                  <input type="number" min="1" max="120" className="chat-textarea" placeholder="Enter your age" value={signup.age} onChange={e => setSignup({ ...signup, age: e.target.value })} required />
                </label>
                <label style={{ gridColumn: '2/3' }}>Gender
                  <select className="chat-textarea" value={signup.gender} onChange={e => setSignup({ ...signup, gender: e.target.value })} required>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
                <label style={{ gridColumn: '1/3' }}>Organization Name
                  <input type="text" className="chat-textarea" placeholder="Enter your organization name" value={signup.organization} onChange={e => setSignup({ ...signup, organization: e.target.value })} required />
                </label>
                <button className="chat-button" type="submit" style={{ gridColumn: '1/3', marginTop: '1rem', fontSize: '1.1rem' }}>Sign Up</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentWatchdog;
