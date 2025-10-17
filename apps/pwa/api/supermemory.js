/**
 * Vercel serverless function to proxy Supermemory API requests
 * This avoids CORS issues in production by making the API call from the server
 */
module.exports = async function handler(req, res) {
  // Only allow requests from your domain in production
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://astrsk.ai',
    'https://www.astrsk.ai',
    'https://astrsk-pwa-git-006-users-youndukn-astrsk-harpy-chat.vercel.app/'
  ];

  const origin = req.headers.origin || '';

  // Check if origin matches or is a Vercel preview deployment
  const isAllowed = allowedOrigins.includes(origin) ||
    origin.includes('.vercel.app') ||
    origin.includes('astrsk');

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-supermemory-user-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the API key from environment variable
    const apiKey = process.env.VITE_SUPERMEMORY_API_KEY;
    if (!apiKey) {
      console.error('[Supermemory Proxy] API key not configured');
      return res.status(500).json({ error: 'Supermemory API key not configured' });
    }

    // Extract path from URL (remove /api/supermemory prefix)
    const fullPath = req.url || '/';
    const apiPath = fullPath.replace(/^\/api\/supermemory/, '');
    const targetUrl = `https://api.supermemory.ai${apiPath}`;

    console.log('[Supermemory Proxy] Request:', req.method, targetUrl);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    // Add optional user ID header if present
    if (req.headers['x-supermemory-user-id']) {
      headers['x-supermemory-user-id'] = req.headers['x-supermemory-user-id'];
    }

    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // Add body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      if (req.body && typeof req.body === 'object') {
        fetchOptions.body = JSON.stringify(req.body);
        } else if (typeof req.body === 'string') {
        fetchOptions.body = req.body;
      }
    }

    // Forward the request to Supermemory API
    const response = await fetch(targetUrl, fetchOptions);

    console.log('[Supermemory Proxy] Response status:', response.status);

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Supermemory Proxy] Error:', error);
    res.status(500).json({
      error: 'Failed to proxy request to Supermemory API',
      details: error.message || String(error),
    });
  }
}
