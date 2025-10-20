/**
 * Vercel serverless function to proxy Supermemory search requests
 */
module.exports = async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://astrsk.ai',
    'https://www.astrsk.ai',
    'https://astrsk-pwa-git-006-users-youndukn-astrsk-harpy-chat.vercel.app',
  ];

  const origin = req.headers.origin || '';
  const isAllowed = allowedOrigins.includes(origin);

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-supermemory-user-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.VITE_SUPERMEMORY_API_KEY;
    if (!apiKey) {
      console.error('[Supermemory Search] API key not configured');
      return res.status(500).json({ error: 'Supermemory API key not configured' });
    }

    const targetUrl = `https://api.supermemory.ai/v4/search`;
    console.log('[Supermemory Search] Request:', req.method, targetUrl);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    if (req.headers['x-supermemory-user-id']) {
      headers['x-supermemory-user-id'] = req.headers['x-supermemory-user-id'];
    }

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body = typeof req.body === 'object'
        ? JSON.stringify(req.body)
        : req.body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    console.log('[Supermemory Search] Response status:', response.status);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('[Supermemory Search] Error:', error);
    res.status(500).json({
      error: 'Failed to proxy search request',
      details: error.message || String(error),
    });
  }
}
