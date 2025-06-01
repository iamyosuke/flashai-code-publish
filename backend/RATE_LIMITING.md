# Redis-based Rate Limiting System

## Overview

This implementation provides a comprehensive rate limiting system for the AI FlashCards backend API, specifically designed to manage costs and ensure fair resource distribution for AI-powered features.

## Features

### 🚀 Core Capabilities
- **Redis-based sliding window rate limiting** using sorted sets for precise tracking
- **Subscription-aware limits** based on user's current plan
- **Real-time subscription checking** from the database
- **HTTP headers** for rate limit status (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- **Detailed error responses** with upgrade suggestions
- **Thread-safe operations** for concurrent request handling

### 📊 Subscription-based Rate Limits

#### Hourly Limits (All Users)

| Plan Type | Requests per Hour | Target Users |
|-----------|-------------------|--------------|
| **Pro** | 200 | Power users, businesses |
| **Premium** | 50 | Regular users with moderate usage |
| **Basic** | 10 | Casual users |
| **None** | 5 | Free tier, trial users |

#### Monthly Limits (Free Users Only)

| Plan Type | Requests per Month | Notes |
|-----------|-------------------|-------|
| **Pro** | Unlimited | No monthly cap |
| **Premium** | Unlimited | No monthly cap |
| **Basic** | Unlimited | No monthly cap |
| **None** | 50 | Free tier monthly cap |

### 🎯 Protected Endpoints

- `POST /api/cards/ai_generate` - AI-powered flashcard generation
- `POST /api/audio/transcribe` - Audio transcription services

## Architecture

### Components

1. **Redis Client** (`services/redis_client.go`)
   - Connection management with environment-based configuration
   - Health checking and automatic fallback detection

2. **Rate Limiter Middleware** (`middleware/rate_limiter_redis.go`)
   - Subscription-aware rate limiting logic
   - Redis and memory-based implementations
   - HTTP response handling

3. **Test Suite** (`middleware/rate_limiter_redis_test.go`)
   - Comprehensive testing coverage
   - Performance benchmarks
   - Fallback scenario testing

### Redis Key Schema

```
rate_limit:v1:{user_id}:{endpoint}:1h
```

- Uses Redis sorted sets with timestamps as both score and member uniqueness
- Automatic cleanup of expired entries
- 2-hour TTL for garbage collection

### Redis Dependency

This implementation requires Redis to be available:
- No fallback mechanism is provided
- If Redis is unavailable, rate limiting will return an error
- Ensure Redis is properly configured and monitored in production

## Configuration

### Environment Variables

```bash
# Upstash Redis Configuration (Recommended for production)
UPSTASH_REDIS_URL=rediss://default:password@hostname.upstash.io:6379  # Complete Upstash Redis URL

# Standard Redis Configuration (For local development)
REDIS_URL=localhost:6379        # Redis server address
REDIS_PASSWORD=                 # Redis password (if required)
REDIS_DB=0                      # Redis database number

# Database Configuration (Required)
DATABASE_URL=postgresql://...   # PostgreSQL connection string
```

### Redis Installation

#### Docker Compose (Recommended)
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

#### Local Installation
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
```

## Implementation Details

### Rate Limiting Algorithm

1. **Sliding Window**: Uses Redis sorted sets to implement precise sliding window rate limiting
2. **Request Processing**:
   - Remove expired entries (older than 1 hour)
   - Count current requests in window
   - Add new request timestamp
   - Check if count exceeds limit

### Error Responses

#### Rate Limit Exceeded (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 50 requests per hour for premium plan",
  "retryAfter": 1234567890,
  "currentPlan": "premium",
  "upgradeMessage": "Upgrade to Pro for 200 requests/hour"
}
```

#### Authentication Required (401)
```json
{
  "error": "Authentication required"
}
```

### HTTP Headers

All responses include rate limiting headers:
- `X-RateLimit-Limit`: Maximum requests allowed per hour
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

## Usage

### Applying Rate Limiting

```go
// In main.go
import "github.com/muratayousuke/ai-flashcards/middleware"

// Apply to route group
aiGroup := api.Group("/cards")
aiGroup.Use(middleware.RedisRateLimiterMiddleware(db, "ai_generate"))
aiGroup.POST("/ai_generate", handler)
```

### Custom Rate Limits

```go
// Modify rateLimits map in rate_limiter_redis.go
var rateLimits = map[string]int{
    "pro":     500,  // Increase Pro limit
    "premium": 100,  // Increase Premium limit
    "basic":   20,   // Increase Basic limit
    "none":    10,   // Increase free tier
}
```

## Testing

### Running Tests

```bash
cd backend
go test ./middleware -v
```

### Test Coverage

- ✅ Subscription plan detection
- ✅ Rate limit enforcement
- ✅ HTTP headers validation
- ✅ Error response formatting
- ✅ Performance benchmarks

### Benchmark Results

```bash
go test ./middleware -bench=.
```

Expected performance:
- Redis mode: ~1000 req/sec per endpoint

## Monitoring

### Redis Monitoring

```bash
# Monitor Redis operations
redis-cli monitor

# Check memory usage
redis-cli info memory

# List rate limiting keys
redis-cli keys "rate_limit:*"
```

### Application Logs

```bash
# Redis connection status
2024-01-01 12:00:00 Redis connected successfully

# Redis connection error
2024-01-01 12:00:00 Warning: Redis connection failed: connection refused. Rate limiting will be unavailable.

# Rate limiting events
2024-01-01 12:00:00 Rate limit check error: redis timeout
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify `REDIS_URL` environment variable
   - System automatically falls back to memory limiting

2. **Rate Limits Not Applied**
   - Verify middleware is registered before routes
   - Check user authentication is working
   - Confirm database connection for subscription queries

3. **Performance Issues**
   - Monitor Redis memory usage
   - Consider Redis clustering for high traffic
   - Check network latency to Redis server

### Health Checks

```bash
# Test Redis connectivity
curl http://localhost:8080/health

# Check rate limiting headers
curl -H "Authorization: Bearer <token>" \
     -I http://localhost:8080/api/cards/ai_generate
```

## Deployment Considerations

### Production Recommendations

1. **Redis Setup**:
   - Use Redis Cluster for high availability
   - Enable persistence (AOF + RDB)
   - Monitor memory usage and set appropriate limits

2. **Upstash Redis Configuration**:
   - **Eviction Setting**: Enable "Eviction" in Upstash dashboard
     - This allows Redis to automatically remove old entries when memory limits are reached
     - Recommended eviction policy: `volatile-ttl` (removes keys with TTL that are closest to expiration)
     - Critical for rate limiting as it prioritizes keeping recent data
   - **TLS**: Ensure TLS is enabled for secure connections
   - **Monitoring**: Set up alerts for high memory usage

3. **Security**:
   - Use Redis AUTH with strong passwords
   - Network isolation for Redis server
   - TLS encryption for Redis connections

4. **Monitoring**:
   - Set up alerts for rate limit violations
   - Monitor Redis performance metrics
   - Track API usage patterns per subscription tier

### Scaling

- **Horizontal Scaling**: Redis supports clustering for distributed rate limiting
- **Vertical Scaling**: Increase Redis memory for larger user bases
- **Regional Deployment**: Use Redis replication for multi-region setups

## Future Enhancements

- [ ] Dynamic rate limit adjustment based on system load
- [ ] Per-endpoint rate limiting configuration
- [ ] Rate limiting analytics dashboard
- [ ] Integration with external rate limiting services (e.g., Kong, Istio)
- [ ] Distributed rate limiting across multiple services
