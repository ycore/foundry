import type { Result } from '@ycore/forge/result';
import { err } from '@ycore/forge/result';
import { getBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { CloudflareProviderConfig, CloudflareRateLimiterOptions, RateLimiterProvider, RateLimiterProviderConfig, RateLimitRequest, RateLimitResponse } from '../../@types/rate-limiter.types';

const DEFAULT_WINDOW_MS = 60 * 1000;

/**
 * Type guard for Cloudflare rate limiter options
 */
function isCloudflareRateLimiterOptions(options: unknown): options is CloudflareRateLimiterOptions {
  return options != null && typeof options === 'object' && 'limiterBinding' in options && typeof (options as CloudflareRateLimiterOptions).limiterBinding === 'string';
}

/**
 * Cloudflare native rate limiting provider
 *
 * Rate limits are configured in wrangler.jsonc (infrastructure-level), not at runtime.
 *
 * Limitations (inherent to Cloudflare's API):
 * - Only returns success boolean (no granular remaining count)
 * - No built-in reset method (must wait for window expiration)
 * - Rate limits per-Cloudflare location (not globally consistent)
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */
export const cloudflareRateLimiter: RateLimiterProvider = {
  name: 'cloudflare',

  async checkLimit(request: RateLimitRequest, config: RateLimiterProviderConfig, context: Readonly<RouterContextProvider>): Promise<Result<RateLimitResponse>> {
    // Type guard: Cloudflare provider config
    if (config.type !== 'cloudflare') {
      return err('Invalid provider type for Cloudflare rate limiter', {
        expectedType: 'cloudflare',
        actualType: config.type,
        providerId: config.id,
      });
    }

    const cfConfig = config as CloudflareProviderConfig;

    // Type guard: Cloudflare rate limiter options
    if (!isCloudflareRateLimiterOptions(cfConfig.options)) {
      return err('Cloudflare rate limiter binding not configured', {
        providerId: cfConfig.id,
        path: request.path,
        identifier: request.identifier,
      });
    }

    const cfOptions = cfConfig.options;
    const bindings = getBindings(context);
    const rateLimiter = bindings[cfOptions.limiterBinding as keyof typeof bindings] as RateLimit | undefined;

    if (!rateLimiter || typeof rateLimiter.limit !== 'function') {
      return err(`RateLimit binding '${cfOptions.limiterBinding}' not found in Cloudflare bindings`, {
        limiterBinding: cfOptions.limiterBinding,
        providerId: config.id,
        path: request.path,
        identifier: request.identifier,
        availableBindings: Object.keys(bindings),
      });
    }

    try {
      const key = `${request.path}:${request.identifier}`;

      // Call Cloudflare's native rate limiting API
      const outcome = await rateLimiter.limit({ key });

      // Note: This is for response metadata only - actual limits are in wrangler.jsonc
      const windowMs = DEFAULT_WINDOW_MS;

      // Map Cloudflare's simple response to our RateLimitResponse interface
      // Note: Cloudflare only provides success boolean, we approximate other fields
      const response: RateLimitResponse = {
        allowed: outcome.success,
        remaining: outcome.success ? 1 : 0, // Return 1 if allowed (optimistic), 0 if blocked
        resetAt: Date.now() + windowMs, // Approximate - Cloudflare doesn't expose exact reset time
        retryAfter: outcome.success ? undefined : Math.ceil(windowMs / 1000), // Provide retryAfter in seconds when rate limited
      };

      return response;
    } catch (error) {
      return err(
        'Failed to check Cloudflare rate limit',
        {
          limiterBinding: cfOptions.limiterBinding,
          providerId: config.id,
          key: `${request.path}:${request.identifier}`,
          path: request.path,
          identifier: request.identifier,
        },
        { cause: error }
      );
    }
  },

  /**
   * Cloudflare's native Rate Limiting API does not provide a reset method
   * Rate limits automatically expire based on the configured period
   */
  async resetLimit(identifier: string, config: RateLimiterProviderConfig, _context: Readonly<RouterContextProvider>): Promise<Result<void>> {
    return err('Cloudflare rate limiter does not support manual reset', {
      providerId: config.id,
      identifier,
      reason: 'Cloudflare Workers Rate Limiting API has no reset method - limits expire automatically based on configured period',
      workaround: 'Wait for rate limit window to expire naturally, or use KV-based provider which supports resetLimit()',
    });
  },
};
