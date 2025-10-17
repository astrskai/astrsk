import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel serverless function to proxy Supermemory API requests
 * This avoids CORS issues in production by making the API call from the server
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow requests from your domain in production
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://astrsk.ai',
    'https://*.astrsk.ai',
    'https://*.vercel.app',
  ];

  const origin = req.headers.origin || '';
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const regex = new RegExp(allowed.replace('*', '.*'));
      return regex.test(origin);
    }
    return allowed === origin;
  });

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
      return res.status(500).json({ error: 'Supermemory API key not configured' });
    }

    // Build the target URL
    const path = req.url?.replace('/api/supermemory', '') || '/';
    const targetUrl = `https://api.supermemory.ai${path}`;

    // Forward the request to Supermemory API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(req.headers['x-supermemory-user-id'] && {
          'x-supermemory-user-id': req.headers['x-supermemory-user-id'] as string,
        }),
      },
      ...(req.body && { body: JSON.stringify(req.body) }),
    });

    const data = await response.json();

    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Supermemory proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy request to Supermemory API',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
