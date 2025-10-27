# Supermemory Production Setup Guide

> Complete guide for deploying Supermemory integration to Vercel production

## Overview

The Supermemory integration uses different proxy configurations for development and production:

- **Development**: Vite proxy (configured in `vite.config.ts`)
- **Production**: Vercel serverless functions (in `api/` folder)

## Architecture

### Development Proxy (Vite)
```
Client → /api/search → Vite Dev Server → https://api.supermemory.ai/v4/search
Client → /api/documents → Vite Dev Server → https://api.supermemory.ai/v3/documents
```

### Production Proxy (Vercel)
```
Client → /api/search → Vercel Function → https://api.supermemory.ai/v4/search
Client → /api/documents → Vercel Function → https://api.supermemory.ai/v3/documents
```

## Vercel Serverless Functions

### File Structure
```
astrsk/                              # Repository root
├── api/                             # Vercel serverless functions
│   ├── search.js                    # Search endpoint proxy
│   ├── documents.js                 # Base documents endpoint
│   └── documents/
│       └── [...path].js             # Catch-all for /documents/* routes
├── apps/pwa/
│   ├── src/                         # Application code
│   └── vite.config.ts               # Dev proxy configuration
└── vercel.json                      # Vercel configuration
```

**Note**: API functions are at the **repository root** level (`api/`), not in `apps/pwa/api/`.

### Endpoint Mapping

| Client Request | Vercel Function | Supermemory API |
|---------------|-----------------|-----------------|
| `POST /api/search` | `api/search.js` | `POST /v4/search` |
| `POST /api/documents` | `api/documents.js` | `POST /v3/documents` |
| `GET /api/documents/{id}` | `api/documents/[...path].js` | `GET /v3/documents/{id}` |
| `PATCH /api/documents/{id}` | `api/documents/[...path].js` | `PATCH /v3/documents/{id}` |
| `DELETE /api/documents/{id}` | `api/documents/[...path].js` | `DELETE /v3/documents/{id}` |
| `DELETE /api/documents/bulk` | `api/documents/[...path].js` | `DELETE /v3/documents/bulk` |

### Additional Features

The serverless functions include:
- **CORS support** with allowed origins for localhost and production domains
- **x-supermemory-user-id header** forwarding for multi-user support
- **Content-type detection** for proper response handling
- **Error handling** with detailed logging

## Environment Variables

### Required Variables

**Environment Variable**: `VITE_SUPERMEMORY_API_KEY`

This variable is used in both development and production:
- **Development**: Read by Vite proxy (vite.config.ts)
- **Production**: Read by Vercel serverless functions

### Setting Up Environment Variables

#### 1. Local Development

Create a `.env` file in `apps/pwa/`:

```bash
VITE_SUPERMEMORY_API_KEY=your_api_key_here
```

#### 2. Vercel Production

Add the environment variable in Vercel Dashboard:

1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add variable:
   - **Name**: `VITE_SUPERMEMORY_API_KEY`
   - **Value**: Your Supermemory API key
   - **Environments**: Production, Preview, Development

Or use Vercel CLI:

```bash
vercel env add VITE_SUPERMEMORY_API_KEY
```

## Deployment Checklist

### Pre-Deployment

- [ ] Ensure `VITE_SUPERMEMORY_API_KEY` is set in Vercel environment variables
- [ ] Verify serverless functions exist at repository root:
  - [ ] `api/search.js`
  - [ ] `api/documents.js`
  - [ ] `api/documents/[...path].js`
- [ ] Check `vercel.json` rewrite configuration (should exclude `/api/*`)
- [ ] Verify CORS origins are configured in API functions
- [ ] Test locally with `vercel dev` (see Testing section)

### Post-Deployment

- [ ] Verify API endpoints are accessible:
  - [ ] `https://your-domain.vercel.app/api/search` (should return 405 for GET)
  - [ ] Test with actual Supermemory operations
- [ ] Check Vercel function logs for errors
- [ ] Monitor function execution time and costs

## Testing

### Local Testing with Vercel CLI

Install Vercel CLI:
```bash
npm install -g vercel
```

Test serverless functions locally:
```bash
cd apps/pwa
vercel dev
```

This will:
- Start the Vite dev server
- Run Vercel serverless functions locally
- Allow testing the exact production environment

### Testing API Endpoints

#### Test Search Endpoint
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "q": "test query",
    "containerTag": "session_123::world",
    "limit": 5
  }'
```

#### Test Documents Endpoint (Add)
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "containerTag": "session_123::character_456",
    "content": "Test memory content",
    "metadata": {
      "speaker": "character_456",
      "participants": ["character_456"],
      "game_time": 1,
      "game_time_interval": "Day",
      "type": "message"
    }
  }'
```

#### Test Documents Endpoint (Get)
```bash
curl http://localhost:3000/api/documents/memory_id_123
```

#### Test Documents Endpoint (Update)
```bash
curl -X PATCH http://localhost:3000/api/documents/memory_id_123 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated content",
    "metadata": { "version": 2 }
  }'
```

#### Test Documents Endpoint (Delete)
```bash
curl -X DELETE http://localhost:3000/api/documents/memory_id_123
```

#### Test Bulk Delete
```bash
curl -X DELETE http://localhost:3000/api/documents/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["memory_id_1", "memory_id_2"]
  }'
```

## Troubleshooting

### Common Issues

#### 1. "API key not configured" Error

**Symptoms**: 500 error with message "API key not configured"

**Solution**:
- Verify `VITE_SUPERMEMORY_API_KEY` is set in Vercel environment variables
- Redeploy after adding environment variables
- Check Vercel function logs for exact error

#### 2. 404 Not Found on API Routes

**Symptoms**: API routes return 404

**Possible Causes**:
- Serverless functions not deployed
- Incorrect file naming in `api/` folder
- Vercel.json rewrite configuration issue

**Solution**:
- Verify files exist in `apps/pwa/api/`
- Check Vercel deployment logs
- Ensure `vercel.json` rewrite rule is correct:
  ```json
  {
    "source": "/((?!api).*)",
    "destination": "/index.html"
  }
  ```

#### 3. CORS Errors

**Symptoms**: CORS errors in browser console

**Solution**: CORS should be handled by Vercel functions automatically. If issues persist:
- Check Supermemory API CORS configuration
- Verify request headers are being forwarded correctly
- Add CORS headers to Vercel functions if needed

#### 4. Timeout Errors

**Symptoms**: Function execution timeout

**Possible Causes**:
- Supermemory API slow to respond
- Network issues
- Function region mismatch

**Solution**:
- Check Vercel function logs
- Monitor Supermemory API status
- Consider increasing function timeout (if on paid plan)

### Debugging

#### View Function Logs

Vercel Dashboard:
1. Go to your deployment
2. Click on "Functions"
3. Select the function (e.g., `api/search.ts`)
4. View execution logs

Vercel CLI:
```bash
vercel logs
```

#### Monitor Function Performance

Check Vercel dashboard for:
- Execution time
- Memory usage
- Error rate
- Invocation count

## Cost Optimization

### Function Execution Limits

Vercel Free Tier:
- 100GB-hours of function execution per month
- 100,000 function invocations per month

Monitor usage in Vercel dashboard.

### Best Practices

1. **Cache Responses** (if applicable)
   - Consider caching search results for repeated queries
   - Implement rate limiting to prevent excessive API calls

2. **Batch Operations**
   - Use bulk delete instead of multiple single deletes
   - Batch multiple updates when possible

3. **Error Handling**
   - Implement retry logic with exponential backoff
   - Log errors for monitoring

## Security

### API Key Protection

✅ **Secure**: API key is stored in Vercel environment variables
✅ **Secure**: API key is added server-side in Vercel functions
❌ **Never**: Expose API key in client-side code

### Request Validation

Consider adding request validation in Vercel functions:
- Validate request body structure
- Sanitize input data
- Rate limiting per user/session

### HTTPS

All Vercel deployments use HTTPS by default. API keys are transmitted securely.

## Monitoring

### Health Checks

Create a simple health check endpoint:

**File**: `apps/pwa/api/health.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    supermemory: {
      configured: !!process.env.VITE_SUPERMEMORY_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
}
```

Access: `https://your-domain.vercel.app/api/health`

### Metrics to Monitor

- Function execution time
- Error rate
- API key validity
- Supermemory API response times
- Memory usage

## Rollback Procedure

If issues occur in production:

1. **Immediate Rollback**
   ```bash
   vercel rollback
   ```

2. **Deploy Previous Version**
   - Go to Vercel dashboard
   - Select previous deployment
   - Click "Promote to Production"

3. **Disable Supermemory**
   - Remove `VITE_SUPERMEMORY_API_KEY` environment variable
   - Application will gracefully degrade (check `isMemoryClientConfigured()`)

## Additional Resources

- [Vercel Serverless Functions Documentation](https://vercel.com/docs/functions/serverless-functions)
- [Supermemory API Documentation](https://docs.supermemory.ai)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

## Support

For issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test locally with `vercel dev`
4. Review Supermemory API status
5. Check application logs in Supermemory debug panel
