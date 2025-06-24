const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'CORS server running', port: PORT });
});

// Proxy endpoint for external APIs
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, body } = req.body;
    
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// OpenAI API specific proxy
app.post('/api/openai/*', async (req, res) => {
  try {
    const apiKey = req.headers['authorization'];
    if (!apiKey) {
      return res.status(401).json({ error: 'OpenAI API key required' });
    }
    
    const fetch = (await import('node-fetch')).default;
    const endpoint = req.path.replace('/api/openai', '');
    const openaiUrl = `https://api.openai.com/v1${endpoint}`;
    
    const response = await fetch(openaiUrl, {
      method: req.method,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    res.status(500).json({ error: 'OpenAI API request failed', details: error.message });
  }
});

// YouTube API proxy
app.get('/api/youtube/*', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const endpoint = req.path.replace('/api/youtube', '');
    const youtubeUrl = `https://www.googleapis.com/youtube/v3${endpoint}`;
    
    // Add query parameters
    const urlWithParams = new URL(youtubeUrl);
    Object.keys(req.query).forEach(key => {
      urlWithParams.searchParams.append(key, req.query[key]);
    });
    
    const response = await fetch(urlWithParams.toString());
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('YouTube API proxy error:', error);
    res.status(500).json({ error: 'YouTube API request failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔄 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`✅ Ready to handle API requests for YouThumbAI`);
}); 