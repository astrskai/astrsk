# Backend Implementation Plan: Shared Resources API

## Overview

Implement anonymous resource sharing API for harpy.chat backend. This allows users to share flows/cards/sessions via temporary URLs without authentication for upload, but requiring login for access.

## Database Migration

### Create `shared_resources` Table

```sql
-- File: migrations/YYYYMMDD_create_shared_resources.sql

CREATE TABLE shared_resources (
  -- Primary key (client-provided UUID)
  id UUID PRIMARY KEY,

  -- Resource identification
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('flow', 'card', 'session')),
  resource_data JSONB NOT NULL,

  -- Lifecycle management
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  -- Optional: Claiming functionality
  claimed_at TIMESTAMP,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  original_name VARCHAR(255),
  view_count INTEGER DEFAULT 0 NOT NULL,

  -- Constraints
  CONSTRAINT expires_at_check CHECK (expires_at > created_at),
  CONSTRAINT resource_data_not_empty CHECK (jsonb_typeof(resource_data) = 'object')
);

-- Performance indexes
CREATE INDEX idx_shared_resources_expires ON shared_resources(expires_at)
  WHERE claimed_at IS NULL; -- Only index unclaimed resources for cleanup

CREATE INDEX idx_shared_resources_created ON shared_resources(created_at DESC);

CREATE INDEX idx_shared_resources_type ON shared_resources(resource_type);

-- Row-level security (RLS)
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read non-expired resources (if authenticated)
CREATE POLICY "Authenticated users can read non-expired resources"
  ON shared_resources
  FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

-- Policy: Service role can insert (for unauthenticated uploads via API)
CREATE POLICY "Service role can insert resources"
  ON shared_resources
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can delete expired resources (for cleanup cron)
CREATE POLICY "Service role can delete expired resources"
  ON shared_resources
  FOR DELETE
  TO service_role
  USING (expires_at < NOW());

-- Comment for documentation
COMMENT ON TABLE shared_resources IS 'Temporary anonymous resource sharing. Resources auto-expire after 1 hour.';
```

## NestJS Implementation

### 1. Module Structure

```
src/modules/shared-resources/
├── shared-resources.module.ts
├── shared-resources.controller.ts
├── shared-resources.service.ts
├── dto/
│   ├── create-shared-resource.dto.ts
│   └── shared-resource-response.dto.ts
├── entities/
│   └── shared-resource.entity.ts
└── guards/
    └── rate-limit.guard.ts
```

### 2. DTOs and Validation

```typescript
// dto/create-shared-resource.dto.ts
import { IsEnum, IsObject, IsOptional, IsInt, Min, Max } from 'class-validator';

export enum ResourceType {
  FLOW = 'flow',
  CARD = 'card',
  SESSION = 'session',
}

export class CreateSharedResourceDto {
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsObject()
  resourceData: any;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440) // Max 24 hours
  expiresInMinutes?: number = 60;
}

// dto/shared-resource-response.dto.ts
export class SharedResourceResponseDto {
  id: string;
  resourceType: ResourceType;
  resourceData: any;
  originalName: string;
  expiresAt: Date;
  createdAt: Date;
  viewCount: number;
}
```

### 3. Service Layer

```typescript
// shared-resources.service.ts
import { Injectable, NotFoundException, ConflictException, PayloadTooLargeException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedResource } from './entities/shared-resource.entity';
import { CreateSharedResourceDto } from './dto/create-shared-resource.dto';

@Injectable()
export class SharedResourcesService {
  private readonly MAX_RESOURCE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(
    @InjectRepository(SharedResource)
    private sharedResourceRepo: Repository<SharedResource>,
  ) {}

  /**
   * Create a new shared resource with client-provided UUID
   */
  async create(id: string, dto: CreateSharedResourceDto): Promise<SharedResource> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ConflictException('Invalid UUID format');
    }

    // Check if resource already exists (UUID collision)
    const existing = await this.sharedResourceRepo.findOne({ where: { id } });
    if (existing) {
      throw new ConflictException('Resource with this ID already exists');
    }

    // Validate resource size
    const resourceSize = JSON.stringify(dto.resourceData).length;
    if (resourceSize > this.MAX_RESOURCE_SIZE) {
      throw new PayloadTooLargeException('Resource exceeds 10MB limit');
    }

    // Extract original name from resource data
    const originalName = this.extractResourceName(dto.resourceData, dto.resourceType);

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (dto.expiresInMinutes || 60));

    // Create resource
    const resource = this.sharedResourceRepo.create({
      id,
      resourceType: dto.resourceType,
      resourceData: dto.resourceData,
      originalName,
      expiresAt,
    });

    return await this.sharedResourceRepo.save(resource);
  }

  /**
   * Get a shared resource by ID (increments view count)
   */
  async findOne(id: string, userId?: string): Promise<SharedResource> {
    const resource = await this.sharedResourceRepo.findOne({ where: { id } });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    // Check if expired
    if (resource.expiresAt < new Date()) {
      throw new NotFoundException('Resource has expired');
    }

    // Increment view count
    await this.sharedResourceRepo.increment({ id }, 'viewCount', 1);

    // Optional: Track first claim
    if (userId && !resource.claimedBy) {
      resource.claimedAt = new Date();
      resource.claimedBy = userId;
      await this.sharedResourceRepo.save(resource);
    }

    return resource;
  }

  /**
   * Cleanup expired resources (called by cron job)
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.sharedResourceRepo
      .createQueryBuilder()
      .delete()
      .where('expires_at < NOW()')
      .execute();

    return result.affected || 0;
  }

  /**
   * Extract resource name from data for display
   */
  private extractResourceName(data: any, type: ResourceType): string {
    const name = data?.name || data?.title || data?.flowName || 'Untitled';
    return `${name} (${type})`;
  }
}
```

### 4. Controller

```typescript
// shared-resources.controller.ts
import { Controller, Put, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SharedResourcesService } from './shared-resources.service';
import { CreateSharedResourceDto } from './dto/create-shared-resource.dto';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Your existing auth guard
import { Public } from '../auth/decorators/public.decorator'; // Decorator to skip auth

@Controller('api/shared-resources')
export class SharedResourcesController {
  constructor(private readonly service: SharedResourcesService) {}

  /**
   * Upload resource (no auth required, rate limited)
   * Client provides UUID in URL
   */
  @Public() // Skip authentication
  @UseGuards(RateLimitGuard) // Rate limiting: 10 uploads/IP/hour
  @Put(':id')
  async create(
    @Param('id') id: string,
    @Body() dto: CreateSharedResourceDto,
  ) {
    const resource = await this.service.create(id, dto);

    return {
      success: true,
      id: resource.id,
      url: `${process.env.APP_URL}/flows/detail/${resource.id}`,
      expiresAt: resource.expiresAt,
    };
  }

  /**
   * Access resource (auth required)
   */
  @UseGuards(JwtAuthGuard) // Require authentication
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id; // Extract user ID from JWT
    const resource = await this.service.findOne(id, userId);

    return {
      id: resource.id,
      resourceType: resource.resourceType,
      resourceData: resource.resourceData,
      originalName: resource.originalName,
      expiresAt: resource.expiresAt,
      createdAt: resource.createdAt,
      viewCount: resource.viewCount,
    };
  }
}
```

### 5. Rate Limiting Guard

```typescript
// guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Simple in-memory rate limiter (consider Redis for production)
@Injectable()
export class RateLimitGuard implements CanActivate {
  private uploads = new Map<string, { count: number; resetAt: number }>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;

    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    const limit = 10; // 10 uploads per hour

    // Get or create rate limit entry
    let entry = this.uploads.get(ip);

    if (!entry || now > entry.resetAt) {
      // Create new entry or reset expired one
      entry = { count: 0, resetAt: now + hourInMs };
      this.uploads.set(ip, entry);
    }

    // Check limit
    if (entry.count >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Maximum 10 uploads per hour.',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;

    return true;
  }
}

// For production, use Redis-based rate limiting:
// npm install @nestjs/throttler
// See: https://docs.nestjs.com/security/rate-limiting
```

### 6. Cron Job for Cleanup

```typescript
// shared-resources.service.ts (add to existing service)
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SharedResourcesService {
  // ... existing methods ...

  /**
   * Run cleanup every 15 minutes
   */
  @Cron(CronExpression.EVERY_15_MINUTES)
  async handleCleanupCron() {
    const deletedCount = await this.cleanupExpired();
    console.log(`[Cleanup] Deleted ${deletedCount} expired shared resources`);
  }
}
```

### 7. Module Configuration

```typescript
// shared-resources.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // For cron jobs
import { SharedResourcesController } from './shared-resources.controller';
import { SharedResourcesService } from './shared-resources.service';
import { SharedResource } from './entities/shared-resource.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SharedResource]),
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [SharedResourcesController],
  providers: [SharedResourcesService],
  exports: [SharedResourcesService],
})
export class SharedResourcesModule {}
```

## Environment Variables

Add to `.env`:

```bash
# Shared Resources Configuration
APP_URL=https://harpy.chat
MAX_RESOURCE_SIZE_MB=10
SHARED_RESOURCE_DEFAULT_EXPIRY_MINUTES=60
```

## Testing Requirements

### Unit Tests

```typescript
// shared-resources.service.spec.ts
describe('SharedResourcesService', () => {
  it('should create a shared resource with client-provided UUID', async () => {
    const id = 'abc-123-def-456';
    const dto = {
      resourceType: ResourceType.FLOW,
      resourceData: { name: 'Test Flow', nodes: [] },
      expiresInMinutes: 60,
    };

    const result = await service.create(id, dto);

    expect(result.id).toBe(id);
    expect(result.expiresAt).toBeDefined();
  });

  it('should throw ConflictException on UUID collision', async () => {
    const id = 'existing-uuid';
    // Create first resource
    await service.create(id, dto);

    // Attempt to create duplicate
    await expect(service.create(id, dto)).rejects.toThrow(ConflictException);
  });

  it('should throw PayloadTooLargeException for resources >10MB', async () => {
    const largeData = { data: 'x'.repeat(11 * 1024 * 1024) };
    const dto = {
      resourceType: ResourceType.FLOW,
      resourceData: largeData,
    };

    await expect(service.create('uuid', dto)).rejects.toThrow(PayloadTooLargeException);
  });

  it('should increment view count on access', async () => {
    const resource = await service.create('uuid', dto);
    expect(resource.viewCount).toBe(0);

    await service.findOne('uuid');
    const updated = await service.findOne('uuid');
    expect(updated.viewCount).toBe(2);
  });

  it('should cleanup expired resources', async () => {
    // Create expired resource
    const expiredDto = { ...dto, expiresInMinutes: -10 };
    await service.create('expired-uuid', expiredDto);

    const deletedCount = await service.cleanupExpired();
    expect(deletedCount).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// shared-resources.e2e.spec.ts
describe('SharedResourcesController (e2e)', () => {
  it('PUT /api/shared-resources/:id should create resource without auth', () => {
    return request(app.getHttpServer())
      .put('/api/shared-resources/abc-123')
      .send({
        resourceType: 'flow',
        resourceData: { name: 'Test' },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.url).toContain('abc-123');
      });
  });

  it('GET /api/shared-resources/:id should require authentication', () => {
    return request(app.getHttpServer())
      .get('/api/shared-resources/abc-123')
      .expect(401); // Unauthorized
  });

  it('GET /api/shared-resources/:id should return resource when authenticated', () => {
    return request(app.getHttpServer())
      .get('/api/shared-resources/abc-123')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.resourceData).toBeDefined();
      });
  });

  it('should enforce rate limiting (10 uploads/hour)', async () => {
    // Make 10 uploads
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .put(`/api/shared-resources/uuid-${i}`)
        .send(dto)
        .expect(201);
    }

    // 11th upload should fail
    await request(app.getHttpServer())
      .put('/api/shared-resources/uuid-11')
      .send(dto)
      .expect(429); // Too Many Requests
  });
});
```

## Deployment Checklist

- [ ] Run database migration on Supabase
- [ ] Add environment variables to Heroku
- [ ] Deploy NestJS backend with new module
- [ ] Test upload endpoint (no auth)
- [ ] Test access endpoint (with auth)
- [ ] Verify rate limiting works
- [ ] Verify cron job runs every 15 minutes
- [ ] Monitor storage usage
- [ ] Set up alerts for error rates

## Monitoring

### Metrics to Track

1. **Upload Rate**: Requests/minute to PUT endpoint
2. **Storage Usage**: Total size of `shared_resources` table
3. **Cleanup Efficiency**: Resources deleted per cron run
4. **Error Rates**: 409 (collisions), 413 (too large), 429 (rate limit)
5. **Access Patterns**: Most viewed resources

### Logging

```typescript
// Add structured logging
this.logger.log({
  event: 'resource_created',
  resourceId: id,
  resourceType: dto.resourceType,
  size: resourceSize,
  expiresAt: resource.expiresAt,
});

this.logger.log({
  event: 'resource_accessed',
  resourceId: id,
  userId: userId,
  viewCount: resource.viewCount,
});
```

## Security Hardening (Production)

1. **Add CORS restrictions**:
   ```typescript
   app.enableCors({
     origin: ['https://astrsk.ai', 'https://harpy.chat'],
   });
   ```

2. **Add request size limits**:
   ```typescript
   app.use(json({ limit: '10mb' }));
   ```

3. **Sanitize resource data** (prevent XSS):
   ```typescript
   import { sanitize } from 'class-sanitizer';
   sanitize(dto.resourceData);
   ```

4. **Use Redis for rate limiting** (instead of in-memory):
   ```bash
   npm install @nestjs/throttler
   ```

5. **Add request signing** (optional):
   - Client signs request with HMAC
   - Prevents replay attacks

## Timeline Estimate

- Database migration: 1 hour
- Service + Controller: 4 hours
- Rate limiting + Guards: 2 hours
- Cron job: 1 hour
- Testing: 4 hours
- Deployment + monitoring: 2 hours

**Total: ~14 hours** (2 days)
