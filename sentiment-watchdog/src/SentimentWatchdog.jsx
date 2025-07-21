import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, MessageSquare, Eye, Bell, Sun, Moon } from 'lucide-react';
import './SentimentWatchdog.css'; // Import the plain CSS file

const SentimentWatchdog = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode by adding/removing the '.dark' class to the body
  useEffect(() => {
    const body = document.body;
    if (isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Mock data (remains the same)
  const [tickets] = useState([
    { id: 'T1721654321', timestamp: '2:45 PM', channel: 'chat', sentiment: 'angry', confidence: 92, subject: 'Account access problems', customer: 'Customer 847' },
    { id: 'T1721654300', timestamp: '2:44 PM', channel: 'email', sentiment: 'positive', confidence: 87, subject: 'Thank you for great service!', customer: 'Customer 923' },
    { id: 'T1721654280', timestamp: '2:43 PM', channel: 'phone', sentiment: 'negative', confidence: 78, subject: 'Billing issue with recent charge', customer: 'Customer 156' },
  ]);

  const sentimentTrends = [
    { time: '00:00', positive: 65, neutral: 25, negative: 10 },
    { time: '04:00', positive: 70, neutral: 20, negative: 10 },
    { time: '08:00', positive: 45, neutral: 30, negative: 25 },
    { time: '12:00', positive: 40, neutral: 35, negative: 25 },
    { time: '16:00', positive: 35, neutral: 40, negative: 25 },
    { time: '20:00', positive: 50, neutral: 35, negative: 15 }
  ];

  const channelData = [
    { channel: 'Email', positive: 120, neutral: 80, negative: 45 },
    { channel: 'Live Chat', positive: 95, neutral: 65, negative: 55 },
    { channel: 'Phone', positive: 70, neutral: 40, negative: 25 },
    { channel: 'Social', positive: 45, neutral: 30, negative: 35 }
  ];
  
  const sentimentDistribution = [
    { name: 'Positive', value: 55, color: 'var(--color-positive)' },
    { name: 'Neutral', value: 30, color: 'var(--color-neutral)' },
    { name: 'Negative', value: 15, color: 'var(--color-negative)' }
  ];
  
  // Helper to get the correct CSS class for a sentiment
  const getSentimentClass = (sentiment) => {
    switch (sentiment) {
      case 'positive':
      case 'delighted':
        return 'sentiment-positive';
      case 'negative':
      case 'angry':
        return 'sentiment-negative';
      default:
        return 'sentiment-neutral';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
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

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Total Interactions</p>
                <p className="stat-card-value">1,247</p>
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
                <p className="stat-card-value" style={{ color: 'var(--color-positive)' }}>55%</p>
              </div>
              <TrendingUp size={32} style={{ color: 'var(--color-positive)' }} />
            </div>
          </div>
          <div className="card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Negative Sentiment</p>
                <p className="stat-card-value" style={{ color: 'var(--color-negative)' }}>15%</p>
              </div>
              <TrendingDown size={32} style={{ color: 'var(--color-negative)' }} />
            </div>
          </div>
          <div className="card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">Active Alerts</p>
                <p className="stat-card-value" style={{ color: 'var(--color-warning)' }}>2</p>
              </div>
              <Bell size={32} style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
        </section>

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
                <Line type="monotone" dataKey="positive" stroke="var(--color-positive)" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="var(--color-neutral)" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="var(--color-negative)" strokeWidth={2} />
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
                <Bar dataKey="positive" stackId="a" fill="var(--color-positive)" />
                <Bar dataKey="neutral" stackId="a" fill="var(--color-neutral)" />
                <Bar dataKey="negative" stackId="a" fill="var(--color-negative)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Live Feed */}
        <section className="feed-grid">
            <div className="card">
                <div className="panel-header">
                    <h3 className="panel-title">Recent Tickets</h3>
                </div>
                <div className="panel-scroll-content">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="ticket-item">
                            <div className="ticket-header">
                                <span className="ticket-id">{ticket.id}</span>
                                <span className={`sentiment-badge ${getSentimentClass(ticket.sentiment)}`}>
                                  {ticket.sentiment}
                                </span>
                            </div>
                            <p className="ticket-subject">{ticket.subject}</p>
                            <div className="ticket-meta">
                                <span>{ticket.customer} • {ticket.channel}</span>
                                <span>{ticket.timestamp}</span>
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