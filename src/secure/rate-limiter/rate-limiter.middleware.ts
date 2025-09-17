import { logger } from '@ycore/forge/logger';
import { isError } from '@ycore/forge/result';
import type { MiddlewareFunction } from 'react-router';
import type { RateLimiterConfig } from './@types/rate-limiter.types';
import { checkRateLimit } from './rate-limiter.provider';
import { getEffectiveRateLimitConfig } from './route-matcher';

/**
 * Rate limiting middleware with intelligent route-based configuration
 */
export function rateLimiterMiddleware(config: RateLimiterConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Get effective configuration for this request
    const effectiveConfig = getEffectiveRateLimitConfig(config, path, method);

    // Skip if no rate limiting should be applied
    if (!effectiveConfig) {
      return next();
    }

    try {
      // Get client identifier (IP address with fallbacks)
      const clientIP =
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        request.headers.get('X-Real-IP') ||
        'unknown';

      // Create temporary config with effective settings for this request
      const requestConfig = {
        ...config,
        providers: [effectiveConfig.providerConfig],
      };

      const rateLimitRequest = {
        identifier: clientIP,
        path: effectiveConfig.keyPrefix ? `${effectiveConfig.keyPrefix}:${path}` : path,
        method: method,
      };

      const rateLimitResult = await checkRateLimit(requestConfig, rateLimitRequest, context);

      if (isError(rateLimitResult)) {
        logger.error('Rate limit check failed', { error: rateLimitResult.message });
        // On error, allow the request through (fail open)
        return next();
      }

      const { allowed, remaining, resetAt, retryAfter } = rateLimitResult;

      if (!allowed) {
        logger.warning('Rate limit exceeded', {
          path: rateLimitRequest.path,
          remaining,
          resetAt,
          retryAfter
        });

        const headers = new Headers({
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': effectiveConfig.providerConfig.maxRequests?.toString() || '10',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
        });

        if (retryAfter) {
          headers.set('Retry-After', retryAfter.toString());
        }

        return new Response(
          JSON.stringify({
            message: 'Too many requests. Please try again later.',
            retryAfter
          }),
          {
            status: 429,
            headers
          }
        );
      }

      logger.debug('Rate limit check passed', { path: rateLimitRequest.path, remaining, resetAt });

      // Add rate limit headers to the response
      const response = await next();

      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', effectiveConfig.providerConfig.maxRequests?.toString() || '10');
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
      }

      return response;

    } catch (error) {
      logger.error('Rate limiter middleware error', { error: error instanceof Error ? error.message : 'Unknown error' });
      // On error, allow the request through (fail open)
      return next();
    }
  };
}
