import type { Result } from '@ycore/forge/result';
import { err, tryCatch } from '@ycore/forge/result';
import { getKVStore } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { KvRateLimiterOptions, RateLimiterProvider, RateLimiterProviderConfig, RateLimitRequest, RateLimitResponse } from '../@types/rate-limiter.types';

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

const rateLimitKvTemplate = (path: string, identifier: string): string => `rate_limit:${path}:${identifier}`;

type RateLimitData = {
  count: number;
  resetAt: number;
};

export const kvRateLimiter: RateLimiterProvider = {
  name: 'kv',

  async checkLimit(request: RateLimitRequest, config: RateLimiterProviderConfig, context: RouterContextProvider): Promise<Result<RateLimitResponse>> {
    // Get KV binding from config options
    const kvOptions = config.options as KvRateLimiterOptions | undefined;
    if (!kvOptions?.kvBinding) {
      return err('KV binding not configured for rate limiting');
    }

    // Get the KV namespace from context using the configured binding
    const kv = getKVStore(context, kvOptions.kvBinding);

    if (!kv) {
      return err(`KV namespace '${kvOptions.kvBinding}' not found in bindings`);
    }

    const maxRequests = config.maxRequests ?? DEFAULT_MAX_REQUESTS;
    const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;

    const key = rateLimitKvTemplate(request.path, request.identifier);
    const now = Date.now();

    return tryCatch(
      async () => {
        // Get current rate limit data
        const dataStr = await kv.get(key);
        let data: RateLimitData;

        if (dataStr) {
          data = JSON.parse(dataStr);

          // Check if window has expired
          if (now >= data.resetAt) {
            // Reset the window
            data = {
              count: 1,
              resetAt: now + windowMs,
            };
          } else {
            // Increment counter
            data.count++;
          }
        } else {
          // First request in window
          data = {
            count: 1,
            resetAt: now + windowMs,
          };
        }

        // Check if limit exceeded
        const allowed = data.count <= maxRequests;
        const remaining = Math.max(0, maxRequests - data.count);

        // Store updated data with TTL
        const ttl = Math.ceil((data.resetAt - now) / 1000);
        await kv.put(key, JSON.stringify(data), {
          expirationTtl: ttl,
        });

        const response: RateLimitResponse = {
          allowed,
          remaining,
          resetAt: data.resetAt,
          retryAfter: allowed ? undefined : Math.ceil((data.resetAt - now) / 1000),
        };

        return response;
      },
      'Failed to check rate limit'
    );
  },

  async resetLimit(identifier: string, config: RateLimiterProviderConfig, context: RouterContextProvider): Promise<Result<void>> {
    // Get KV binding from config options
    const kvOptions = config.options as KvRateLimiterOptions | undefined;
    if (!kvOptions?.kvBinding) {
      return err('KV binding not configured for rate limiting');
    }

    // Get the KV namespace from context using the configured binding
    const kv = getKVStore(context, kvOptions.kvBinding);

    if (!kv) {
      return err(`KV namespace '${kvOptions.kvBinding}' not found in bindings`);
    }

    return tryCatch(
      async () => {
        // Delete all rate limit keys for this identifier
        // Note: This is a simplified implementation. In production, you might want to
        // use KV list operations to find and delete all relevant keys
        const key = rateLimitKvTemplate('*', identifier);
        await kv.delete(key);

        return; // Success - void return
      },
      'Failed to reset rate limit'
    );
  },
};
