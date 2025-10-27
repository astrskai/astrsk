/**
 * Vercel serverless function to proxy Supermemory documents requests
 * Handles all routes: /api/documents, /api/documents/{id}, /api/documents/bulk
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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.VITE_SUPERMEMORY_API_KEY;
    if (!apiKey) {
      console.error('[Supermemory Documents] API key not configured');
      return res.status(500).json({ error: 'Supermemory API key not configured' });
    }

    // Build target URL based on query parameters
    // GET /api/documents?id=mem_123 -> GET /v3/documents/mem_123
    // PATCH /api/documents?id=mem_456 -> PATCH /v3/documents/mem_456
    // DELETE /api/documents?id=mem_789 -> DELETE /v3/documents/mem_789
    // DELETE /api/documents?bulk=true -> DELETE /v3/documents/bulk
    // POST /api/documents -> POST /v3/documents

    let targetPath = '/v3/documents';

    if (req.query.id) {
      // Single document operation (GET, PATCH, DELETE by ID)
      targetPath = `/v3/documents/${req.query.id}`;
    } else if (req.query.bulk === 'true' || req.query.bulk === true) {
      // Bulk delete operation
      targetPath = '/v3/documents/bulk';
    }

    const targetUrl = `https://api.supermemory.ai${targetPath}`;
    console.log('[Supermemory Documents] Request:', req.method, targetUrl);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (['POST', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'object'
        ? JSON.stringify(req.body)
        : req.body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    console.log('[Supermemory Documents] Response status:', response.status);

    // Handle 204 No Content (successful DELETE)
    if (response.status === 204) {
      return res.status(204).end();
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('[Supermemory Documents] Error:', error);
    res.status(500).json({
      error: 'Failed to proxy documents request',
      details: error.message || String(error),
    });
  }
}
