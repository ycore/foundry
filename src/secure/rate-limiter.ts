import { getErrorMessage } from '@ycore/forge/error';
import { logger } from '@ycore/forge/logging';
import type { RateLimitData, RateLimitInfo, RateLimitOptions } from './@types/rate-limiter.types';

const RATE_LIMIT_WINDOW_SECONDS = 60; // Default 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 10; // Default 10 requests

/**
 * KV-Based Rate Limiter
 * Simple rate limiting using Cloudflare KV storage
 */
export class RateLimiter {
  private windowSeconds: number;
  private maxRequests: number;
  private kv: KVNamespace;
  private prefix = 'rate_limit';

  constructor(options: RateLimitOptions) {
    this.windowSeconds = options.windowSeconds ?? RATE_LIMIT_WINDOW_SECONDS;
    this.maxRequests = options.maxRequests ?? RATE_LIMIT_MAX_REQUESTS;
    this.kv = options.kv;
  }

  /**
   * Generate KV key for rate limiting
   */
  private getKey(identifier: string): string {
    return `${this.prefix}:${identifier}`;
  }

  /**
   * Check rate limit for identifier
   */
  async check(identifier: string): Promise<RateLimitInfo> {
    const key = this.getKey(identifier);
    const now = Date.now();

    try {
      const result = await this.kv.get<RateLimitData>(key, 'json');

      // First visit - initialize
      if (!result) {
        const newResult = {
          remaining: this.maxRequests - 1,
          reset: now + this.windowSeconds * 1000,
        };

        await this.kv.put(key, JSON.stringify(newResult), {
          expirationTtl: this.windowSeconds,
        });

        return { isLimited: false, ...newResult };
      }

      // Reset window expired - start new window
      if (now >= result.reset) {
        const newResult = {
          remaining: this.maxRequests - 1,
          reset: now + this.windowSeconds * 1000,
        };

        await this.kv.put(key, JSON.stringify(newResult), {
          expirationTtl: this.windowSeconds,
        });

        return { isLimited: false, ...newResult };
      }

      // Check if rate limited
      const isLimited = result.remaining <= 0;
      const remaining = isLimited ? 0 : result.remaining - 1;
      const reset = result.reset;

      // Update remaining count if not limited
      if (!isLimited) {
        await this.kv.put(key, JSON.stringify({ remaining, reset }), {
          expirationTtl: this.windowSeconds,
        });
      }

      return { isLimited, remaining, reset };
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error({ event: 'rate_limit_error', message });

      // On error, don't limit - fail open
      return {
        isLimited: false,
        remaining: this.maxRequests,
        reset: now + this.windowSeconds * 1000,
      };
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    await this.kv.delete(key);
  }
}
