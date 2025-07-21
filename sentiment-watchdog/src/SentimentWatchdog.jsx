import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, MessageSquare, Eye, Bell, Sun, Moon } from 'lucide-react';
import './SentimentWatchdog.css';

const SentimentWatchdog = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [liveTickets, setLiveTickets] = useState([]);
  const [alert, setAlert] = useState(null);
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
        setAlert(message.message);
        setActiveAlerts(prev => prev + 1);
        setTimeout(() => setAlert(null), 5000);
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
      <div className="dashboard-content">
        <header className="header">
          <div>
            <h1 className="header-title">
              <Eye style={{ color: 'var(--color-accent)' }} />
              Sentiment Watchdog
            </h1>
            <p className="header-subtitle">Real-time customer sentiment monitoring</p>
          </div>
          <div className="header-controls">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="theme-toggle-btn"
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <Sun /> : <Moon />}
            </button>
          </div>
        </header>

        {alert && (
            <div className="spike-alert">
                <AlertTriangle /> {alert}
            </div>
        )}

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
          </div>
        </section>

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

      </div>
    </div>
  );
};

export default SentimentWatchdog;