# Anonymous Upload System Design

## Overview

Allow users to share resources (flows, cards, sessions) via temporary, anonymous URLs.

## Architecture

```
┌─────────────┐                    ┌──────────────────┐
│   astrsk    │                    │  harpy.chat      │
│   (PWA)     │                    │  (Backend)       │
└─────────────┘                    └──────────────────┘
      │                                     │
      │ 1. Generate UUID client-side        │
      │    id = crypto.randomUUID()         │
      │                                     │
      │ 2. Upload resource with UUID        │
      │    PUT /api/shared-resources/:id    │
      │    (no auth, client provides UUID)  │
      ├────────────────────────────────────>│
      │                                     │
      │ 3. Returns confirmation             │
      │    { success: true,                 │
      │      expiresAt: "..." }             │
      │<────────────────────────────────────┤
      │                                     │
      │ 4. Client can now share URL         │
      │    harpy.chat/flows/abc-123         │
      │                                     │

┌─────────────┐                    ┌──────────────────┐
│   User B    │                    │  harpy.chat      │
│  (Browser)  │                    │  (Web + Backend) │
└─────────────┘                    └──────────────────┘
      │                                     │
      │ 3. Opens shared URL                 │
      │    GET harpy.chat/flows/abc         │
      ├────────────────────────────────────>│
      │                                     │
      │ 4. Login required                   │
      │    (Supabase Auth)                  │
      │<────────────────────────────────────┤
      │                                     │
      │ 5. After login, fetch resource      │
      │    GET /api/shared-resources/abc    │
      │    (with auth token)                │
      ├────────────────────────────────────>│
      │                                     │
      │ 6. Returns resource data            │
      │    (if not expired)                 │
      │<────────────────────────────────────┤
```

## Database Schema

### Table: `shared_resources`

```sql
CREATE TABLE shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource identification
  resource_type VARCHAR(20) NOT NULL, -- 'flow', 'card', 'session'
  resource_data JSONB NOT NULL,       -- Full resource export

  -- Access control
  access_token VARCHAR(255),          -- Optional: require token in URL for extra security

  -- Lifecycle
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,      -- Default: created_at + 1 hour
  claimed_at TIMESTAMP,               -- When resource was first accessed
  claimed_by UUID,                    -- User ID who claimed (optional)

  -- Metadata
  original_name VARCHAR(255),         -- Resource name for display
  view_count INTEGER DEFAULT 0,       -- Track access

  -- Indexes
  CONSTRAINT expires_at_check CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_shared_resources_expires ON shared_resources(expires_at);
CREATE INDEX idx_shared_resources_created ON shared_resources(created_at DESC);
CREATE INDEX idx_shared_resources_type ON shared_resources(resource_type);
```

## API Endpoints

### 1. Upload Resource (No Auth, Client Provides UUID)

```
PUT /api/shared-resources/:id
Content-Type: application/json

{
  "resourceType": "flow" | "card" | "session",
  "resourceData": { ... },
  "expiresInMinutes": 60  // Optional, default 60
}

Response:
{
  "success": true,
  "id": "abc-123-def",  // Same as URL parameter
  "url": "https://harpy.chat/flows/detail/abc-123-def",
  "expiresAt": "2025-11-18T12:00:00Z"
}

Errors:
- 409: Resource with this ID already exists
- 400: Invalid resource data or ID format
- 413: Resource too large (>10MB)
```

### 2. Access Resource (Auth Required)

```
GET /api/shared-resources/:id
Authorization: Bearer <supabase-token>

Response:
{
  "id": "abc-123-def",
  "resourceType": "flow",
  "resourceData": { ... },
  "originalName": "My Awesome Flow",
  "expiresAt": "2025-11-18T12:00:00Z",
  "createdAt": "2025-11-18T11:00:00Z"
}

Errors:
- 404: Resource not found or expired
- 401: Authentication required
```

### 3. Cleanup Expired Resources (Cron Job)

```
DELETE FROM shared_resources
WHERE expires_at < NOW()
```

Run every 15 minutes via NestJS cron.

## PWA Integration

### Upload Service

```typescript
// apps/pwa/src/app/services/share-service.ts
class ShareService {
  async shareFlow(flowId: string): Promise<Result<ShareResult>> {
    // 1. Generate UUID client-side (security: client controls ID)
    const shareId = crypto.randomUUID();

    // 2. Export flow to enhanced format
    const exportResult = await FlowService.exportFlowWithNodes.execute({ flowId });
    if (exportResult.isFailure) {
      return Result.fail(exportResult.getError());
    }

    // 3. Upload to backend with client-generated UUID
    const response = await fetch(`https://harpy.chat/api/shared-resources/${shareId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceType: 'flow',
        resourceData: exportResult.getValue(),
        expiresInMinutes: 60
      })
    });

    if (!response.ok) {
      if (response.status === 409) {
        // UUID collision (extremely rare) - retry with new UUID
        return this.shareFlow(flowId);
      }
      return Result.fail(`Upload failed: ${response.statusText}`);
    }

    // 4. Return shareable URL (we already know the ID)
    const { url, expiresAt } = await response.json();
    return Result.ok({
      id: shareId,
      url: url || `https://harpy.chat/flows/detail/${shareId}`,
      expiresAt
    });
  }
}
```

### Access Service (via harpy.chat web app)

```typescript
// User accesses: harpy.chat/flows/detail/abc-123
// harpy.chat web app handles:

async function fetchSharedResource(id: string) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`/api/shared-resources/${id}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login?redirect=/flows/detail/' + id;
    return;
  }

  const resource = await response.json();

  // Display resource
  displayFlow(resource.resourceData);

  // Optional: Allow user to "claim" (save to their astrsk)
  // This would download to their local astrsk instance
}
```

## Security Considerations

1. **Client-Side UUID Generation** ✅:
   - Benefit: Client controls the ID (no backend-generated predictable IDs)
   - Benefit: Client can track upload status and retry if needed
   - Benefit: Reduces attack surface (no endpoint enumeration)
   - Mitigation: Backend validates UUID format and checks for collisions (409)

2. **No Authentication for Upload**:
   - Risk: Spam/abuse
   - Mitigation: Rate limiting (10 uploads/IP/hour)
   - Mitigation: 10MB per resource limit
   - Mitigation: Automatic cleanup of expired resources

3. **Public URLs**:
   - Risk: Anyone with URL can access
   - Mitigation: 1-hour expiration by default
   - Mitigation: Access requires login to harpy.chat
   - Future: Optional access tokens for extra security

4. **Storage**:
   - Risk: Unlimited storage consumption
   - Mitigation: 10MB per resource limit (enforced at API level)
   - Mitigation: Automatic cleanup every 15 minutes
   - Mitigation: Monitoring total storage usage

5. **Content Validation**:
   - Validate JSON structure (prevent malformed data)
   - Sanitize resource names (XSS prevention)
   - Check file size limits (DoS prevention)
   - Validate UUID format (prevent path traversal)

## Implementation Order

1. ✅ Design schema (this document)
2. Create database migration (Supabase)
3. Create NestJS module + endpoints
4. Create PWA ShareService
5. Add UI (share button + copy link)
6. Implement cleanup cron job
7. Add rate limiting

## Future Enhancements

- **Claim Feature**: Allow user to save resource to their account permanently
- **Access Tokens**: Optional tokens for private sharing
- **Analytics**: Track view counts, popular resources
- **Extended Expiration**: Allow users to extend expiration time
