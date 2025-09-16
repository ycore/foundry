import type { AppResult } from '@ycore/forge/result';
import { createAppError, returnFailure, returnSuccess } from '@ycore/forge/result';
import { getBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { KvRateLimiterOptions, RateLimiterProvider, RateLimiterProviderConfig, RateLimitRequest, RateLimitResponse } from '../@types/rate-limiter.types';

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

type RateLimitData = {
  count: number;
  resetAt: number;
};

export const kvRateLimiter: RateLimiterProvider = {
  name: 'kv',

  async checkLimit(request: RateLimitRequest, config: RateLimiterProviderConfig, context: RouterContextProvider): Promise<AppResult<RateLimitResponse>> {
    // Get KV binding from config options
    const kvOptions = config.options as KvRateLimiterOptions | undefined;
    if (!kvOptions?.kvBinding) {
      return returnFailure(createAppError('KV binding not configured for rate limiting'));
    }

    // Get the KV namespace from context using the configured binding
    const bindings = getBindings(context);
    const kv = bindings[kvOptions.kvBinding as keyof typeof bindings] as KVNamespace | undefined;

    if (!kv) {
      return returnFailure(createAppError(`KV namespace '${kvOptions.kvBinding}' not found in bindings`));
    }

    const maxRequests = config.maxRequests ?? DEFAULT_MAX_REQUESTS;
    const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;

    const key = `rate_limit:${request.path}:${request.identifier}`;
    const now = Date.now();

    try {
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

      return returnSuccess(response);
    } catch (error) {
      return returnFailure(
        createAppError('Failed to check rate limit', {
          details: error instanceof Error ? { error: error.message } : { error: 'Unknown error' },
        })
      );
    }
  },

  async resetLimit(identifier: string, config: RateLimiterProviderConfig, context: RouterContextProvider): Promise<AppResult<void>> {
    // Get KV binding from config options
    const kvOptions = config.options as KvRateLimiterOptions | undefined;
    if (!kvOptions?.kvBinding) {
      return returnFailure(createAppError('KV binding not configured for rate limiting'));
    }

    // Get the KV namespace from context using the configured binding
    const bindings = getBindings(context);
    const kv = bindings[kvOptions.kvBinding as keyof typeof bindings] as KVNamespace | undefined;

    if (!kv) {
      return returnFailure(createAppError(`KV namespace '${kvOptions.kvBinding}' not found in bindings`));
    }

    try {
      // Delete all rate limit keys for this identifier
      // Note: This is a simplified implementation. In production, you might want to
      // use KV list operations to find and delete all relevant keys
      const key = `rate_limit:*:${identifier}`;
      await kv.delete(key);

      return returnSuccess(undefined);
    } catch (error) {
      return returnFailure(
        createAppError('Failed to reset rate limit', {
          details: error instanceof Error ? { error: error.message } : { error: 'Unknown error' },
        })
      );
    }
  },
};
