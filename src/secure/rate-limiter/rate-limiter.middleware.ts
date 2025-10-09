import { logger } from '@ycore/forge/logger';
import { getClientIP, isError } from '@ycore/forge/result';
import { data, type MiddlewareFunction } from 'react-router';
import type { KvProviderConfig, RateLimiterConfig } from './@types/rate-limiter.types';
import { checkRateLimit } from './rate-limiter.provider';
import { getEffectiveRateLimitConfig } from './route-matcher';

/**
 * Rate limiting middleware with intelligent route-based configuration - throws a 429 response when rate limit exceeded
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

    // Create temporary config with effective settings for this request
    const requestConfig = { ...config, providers: [effectiveConfig.providerConfig] };
    const clientIP = getClientIP(request) || 'unknown';
    const rateLimitRequest = { identifier: clientIP, path: path, method: method };
    const rateLimitResult = await checkRateLimit(requestConfig, rateLimitRequest, context, effectiveConfig.providerId);

    if (isError(rateLimitResult)) {
      logger.error('Rate limit check (failed open)', { error: rateLimitResult.message });
      // On error, allow the request through (fail open)
      return next();
    }

    const { allowed, remaining, resetAt, retryAfter } = rateLimitResult;

    // Get limit value based on provider type for headers
    const limitHeader = effectiveConfig.providerConfig.type === 'kv' ? (effectiveConfig.providerConfig as KvProviderConfig).limits.maxRequests.toString() : '100';

    if (!allowed) {
      logger.warning('Rate limit exceeded', { path: rateLimitRequest.path, remaining, resetAt, retryAfter });

      const headers: HeadersInit = {
        'X-RateLimit-Limit': limitHeader,
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
      };

      if (retryAfter) {
        headers['Retry-After'] = retryAfter.toString();
      }

      // Throw response to ensure proper encoding
      throw data({ message: 'Too many requests. Please try again later.', retryAfter }, { status: 429, headers });
    }

    const response = await next();

    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', limitHeader);
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
    }

    return response;
  };
}
