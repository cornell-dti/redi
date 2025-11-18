# Rate Limiting Implementation Guide

## Overview

This backend now features production-ready rate limiting with:
- ✅ **Multi-dyno support** via Redis (scales across multiple Heroku dynos)
- ✅ **Per-user rate limiting** for authenticated endpoints (not per-IP)
- ✅ **Admin whitelist** - admins bypass all rate limits
- ✅ **Industry-standard limits** optimized for 500+ concurrent users
- ✅ **Standard rate limit headers** in responses
- ✅ **Automatic fallback** to in-memory store if Redis unavailable

## Redis Setup on Heroku

### Option 1: Heroku Redis (Recommended)

```bash
# Add Heroku Redis add-on (mini plan = $3/month, hobby-dev = free but limited)
heroku addons:create heroku-redis:mini

# Verify it's installed
heroku config:get REDIS_URL
```

The `REDIS_URL` environment variable will be automatically set.

### Option 2: External Redis Provider

If using an external Redis provider (Redis Cloud, Redis Labs, etc.):

```bash
# Set the REDIS_URL environment variable
heroku config:set REDIS_URL=redis://your-redis-url:6379
```

### Development (No Redis)

For local development, Redis is optional. The rate limiter will:
- Automatically fall back to in-memory store
- Show warnings in console about multi-dyno limitations
- Work fine for single-dyno development

## Rate Limit Categories

### 1. Authentication Rate Limit
**Used for:** Login, signup, password reset
**Limit:** 5 requests per 15 minutes per IP
**Behavior:** Only counts failed attempts (successful requests don't count)

```typescript
import { authenticationRateLimit } from '../middleware/rateLimiting';

router.post('/api/users/firebase-login', authenticationRateLimit, authenticateUser, handler);
```

### 2. Read Rate Limit
**Used for:** GET requests - profiles, matches, lists
**Limit:** 300 requests per 15 minutes per user (~20/min sustained)

```typescript
import { readRateLimit } from '../middleware/rateLimiting';

router.get('/api/profiles/:netid', authenticateUser, readRateLimit, handler);
```

### 3. Write Rate Limit
**Used for:** POST/PUT/PATCH - updates, preferences, answers
**Limit:** 100 requests per 15 minutes per user (~6.7/min sustained)

```typescript
import { writeRateLimit } from '../middleware/rateLimiting';

router.post('/api/profiles', authenticateUser, writeRateLimit, handler);
router.patch('/api/profiles/:netid', authenticateUser, writeRateLimit, handler);
```

### 4. Resource-Intensive Rate Limit
**Used for:** Image uploads, matching algorithm, bulk operations
**Limit:** 20 requests per hour per user

```typescript
import { resourceIntensiveRateLimit } from '../middleware/rateLimiting';

router.post('/api/images/upload', authenticateUser, resourceIntensiveRateLimit, handler);
```

### 5. Chat Rate Limit
**Used for:** Sending messages, creating conversations
**Limit:** 60 messages per minute per user (1/second sustained)

```typescript
import { chatRateLimit } from '../middleware/rateLimiting';

router.post('/api/chat/messages', authenticateUser, chatRateLimit, handler);
```

### 6. Notification Rate Limit
**Used for:** Notification polling endpoints
**Limit:** 200 requests per 15 minutes per user (~13/min)

```typescript
import { notificationRateLimit } from '../middleware/rateLimiting';

router.get('/api/notifications', authenticateUser, notificationRateLimit, handler);
```

### 7. Public Rate Limit
**Used for:** Public endpoints without authentication
**Limit:** 50 requests per 15 minutes per IP

```typescript
import { publicRateLimit } from '../middleware/rateLimiting';

router.get('/api/landing-emails', publicRateLimit, handler);
```

### 8. Admin Rate Limit
**Used for:** Admin-only endpoints
**Limit:** 1000 requests per 15 minutes (effectively unlimited)
**Note:** Admins also bypass rate limiting via whitelist

```typescript
import { adminRateLimit } from '../middleware/rateLimiting';

router.get('/api/admin/users', requireAdmin, adminRateLimit, handler);
```

## Legacy Exports (Backward Compatibility)

These exports maintain compatibility with existing code:

```typescript
// These are aliases to the new rate limiters
export const authenticatedRateLimit = readRateLimit;
export const uploadRateLimit = resourceIntensiveRateLimit;
```

## Rate Limit Headers

All responses include standard rate limit headers:

```
RateLimit-Limit: 300
RateLimit-Remaining: 299
RateLimit-Reset: 1704067200
```

When rate limit is exceeded:

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": "2024-01-01T00:00:00.000Z"
}
```

HTTP Status: `429 Too Many Requests`

## Admin Whitelist

Admins are automatically whitelisted and bypass all rate limits:

1. Admin status is checked via Firebase custom claims
2. Admin must exist in `admins` Firestore collection
3. Admin account must not be disabled
4. Bypasses rate limits before counting requests

No configuration needed - works automatically with existing admin authentication.

## How It Works

### Per-User Rate Limiting

**Authenticated requests:**
- Key format: `user:{firebase_uid}`
- Tracks limits per user across all devices/IPs
- Fair distribution for legitimate multi-device usage

**Public requests:**
- Key format: `ip:{ip_address}`
- Prevents scraping and abuse from single IP
- Appropriate for unauthenticated endpoints

### Redis Distribution

When Redis is configured:
- All rate limit counters stored in Redis
- Shared across all Heroku dynos
- Consistent rate limiting regardless of which dyno handles request
- TTL (time-to-live) automatically managed

Without Redis:
- Falls back to in-memory store
- Only works correctly with single dyno
- Console warnings indicate multi-dyno limitation

## Monitoring & Alerts

### What to Monitor

1. **429 Response Rate**
   ```
   Filter logs for: "Rate limit exceeded"
   Alert if: >1% of requests returning 429
   ```

2. **Redis Connection Health**
   ```
   Filter logs for: "Redis client error"
   Alert if: Redis connection failures
   ```

3. **Redis Memory Usage**
   ```bash
   heroku redis:info
   # Watch for memory usage approaching 100%
   ```

### Heroku Logs

```bash
# Watch rate limit logs
heroku logs --tail | grep "Rate Limit"

# Check for 429 responses
heroku logs --tail | grep "Rate limit exceeded"

# Monitor Redis connection
heroku logs --tail | grep "Redis"
```

## Rate Limit Calculations for 500+ Users

### Expected Usage (Normal)
- **Concurrent users:** 500
- **Average session:** 5 minutes
- **Requests per session:** 20-30
- **Peak rate:** ~100-150 requests/min total
- **Per user:** 2-3 requests/min during active use

### Configured Limits (Headroom)
| Endpoint Type | Limit | Per | Headroom |
|--------------|-------|-----|----------|
| Auth | 5 | 15 min | Blocks brute force |
| Read | 300 | 15 min | 10x normal usage |
| Write | 100 | 15 min | 3x normal usage |
| Chat | 60 | 1 min | Natural conversation |
| Notifications | 200 | 15 min | 6x polling frequency |
| Resource-intensive | 20 | 1 hour | Prevents abuse |
| Public | 50 | 15 min | Prevents scraping |

## Adjusting Limits

To adjust rate limits, edit `/backend/src/middleware/rateLimiting.ts`:

```typescript
export const readRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // Time window
  max: 300,                  // Max requests in window
  keyGenerator: generateUserKey,
  message: {
    error: 'Custom error message',
    retryAfter: '15 minutes',
  },
});
```

**Best practices:**
- Start conservative, increase based on actual usage
- Monitor 429 responses to identify legitimate users hitting limits
- Consider time of day and usage patterns
- Document rationale for any changes

## Testing Rate Limits

### Local Testing (No Redis)

```bash
# Start the backend
npm run dev

# Make repeated requests
for i in {1..10}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/profiles/NETID
done
```

### Production Testing

```bash
# Check Redis connection
heroku logs --tail | grep "Redis initialized"

# Test rate limiting
curl -i https://your-app.herokuapp.com/api/endpoint
# Check RateLimit-* headers in response
```

### Admin Bypass Testing

```bash
# Login as admin
# Make >300 requests in 15 minutes
# Should NOT receive 429 responses
```

## Troubleshooting

### Issue: "No REDIS_URL configured"
**Solution:** Add Heroku Redis addon or set REDIS_URL environment variable

### Issue: "Redis connection failed"
**Solution:**
- Verify Redis addon is active: `heroku addons`
- Check Redis credentials: `heroku config:get REDIS_URL`
- Restart dynos: `heroku restart`

### Issue: Rate limits not working across dynos
**Solution:**
- Verify Redis is properly configured
- Check logs for "Redis initialized successfully"
- May need to scale down to 1 dyno temporarily for testing

### Issue: Legitimate users hitting rate limits
**Solution:**
- Review actual usage patterns in logs
- Increase limits for specific endpoint category
- Consider batching API calls in frontend
- Check for infinite loops or polling issues

### Issue: Admin still getting rate limited
**Solution:**
- Verify admin exists in `admins` collection
- Check admin custom claims: Firebase console > Authentication > User
- Ensure admin account not disabled
- Check logs for "Admin bypassing rate limit"

## Security Considerations

1. **Brute Force Protection:** Auth endpoints limit to 5 attempts per 15 min
2. **DoS Prevention:** All endpoints have reasonable limits
3. **Resource Protection:** Upload/intensive operations heavily restricted
4. **Scraping Prevention:** Public endpoints use IP-based limiting
5. **Account Enumeration:** Auth uses IP keys instead of user keys

## Performance Impact

- **Overhead:** ~1-5ms per request
- **Redis latency:** ~1-3ms for read/write
- **Memory (no Redis):** ~100KB per 1000 active rate limit entries
- **Memory (with Redis):** Minimal backend memory impact
- **Redis storage:** ~1KB per active user

## Next Steps

1. ✅ Install Redis on Heroku: `heroku addons:create heroku-redis:mini`
2. ✅ Verify deployment: Check logs for "Redis initialized successfully"
3. ⏱️ Monitor 429 responses for first week
4. ⏱️ Adjust limits based on actual usage patterns
5. ⏱️ Set up alerts for high 429 rates
6. ⏱️ Review and optimize frontend API call patterns

## Support

For issues or questions:
- Review logs: `heroku logs --tail | grep "Rate Limit"`
- Check Redis: `heroku redis:info`
- Review this guide: `/backend/RATE_LIMITING_GUIDE.md`
- Check implementation: `/backend/src/middleware/rateLimiting.ts`
