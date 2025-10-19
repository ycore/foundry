import type { Result } from '@ycore/forge/result';
import { err } from '@ycore/forge/result';
import { getKVStore } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import type { KvProviderConfig, KvRateLimiterOptions, RateLimiterProvider, RateLimiterProviderConfig, RateLimitMetadata, RateLimitRequest, RateLimitResponse } from '../../@types/rate-limiter.types';

const KV_MINIMUM_TTL = 60; // Cloudflare KV minimum TTL in seconds
const DEFAULT_RETRY_ATTEMPTS = 3; // Default retries for optimistic locking
const RETRY_DELAY_MS = 50; // Base delay between retries
const KV_KEY_PREFIX = 'rate_limit'; // Fixed prefix for KV namespace organization

const rateLimitKvTemplate = (path: string, identifier: string): string => `${KV_KEY_PREFIX}:${path}:${identifier}`;

/**
 * Type guard for KV rate limiter options
 */
function isKvRateLimiterOptions(options: unknown): options is KvRateLimiterOptions {
  return options != null && typeof options === 'object' && 'kvBinding' in options && typeof (options as KvRateLimiterOptions).kvBinding === 'string';
}

/**
 * Type guard and validator for rate limit metadata
 */
function isValidRateLimitMetadata(metadata: unknown): metadata is RateLimitMetadata {
  if (metadata == null || typeof metadata !== 'object') {
    return false;
  }

  const meta = metadata as RateLimitMetadata;
  return typeof meta.count === 'number' && typeof meta.resetAt === 'number' && typeof meta.version === 'number' && meta.count >= 0 && meta.resetAt > 0 && meta.version >= 0;
}

export const kvRateLimiter: RateLimiterProvider = {
  name: 'kv',

  async checkLimit(request: RateLimitRequest, config: RateLimiterProviderConfig, context: Readonly<RouterContextProvider>): Promise<Result<RateLimitResponse>> {
    // Type guard: Ensure this is a KV provider config
    if (config.type !== 'kv') {
      return err('Invalid provider type for KV rate limiter', {
        expectedType: 'kv',
        actualType: config.type,
        providerId: config.id,
      });
    }

    const kvConfig = config as KvProviderConfig;

    // Validate KV binding configuration
    if (!isKvRateLimiterOptions(kvConfig.options)) {
      return err('KV binding not configured for rate limiting', {
        providerId: kvConfig.id,
        path: request.path,
        identifier: request.identifier,
      });
    }

    const kvOptions = kvConfig.options;

    // Get the KV namespace from context using the configured binding
    const kv = getKVStore(context, kvOptions.kvBinding);

    if (!kv) {
      return err(`KV namespace '${kvOptions.kvBinding}' not found in bindings`, {
        kvBinding: kvOptions.kvBinding,
        providerId: kvConfig.id,
        path: request.path,
        identifier: request.identifier,
      });
    }

    // Extract limits from provider config
    const maxRequests = kvConfig.limits.maxRequests;
    const windowMs = kvConfig.limits.windowMs;
    const maxRetries = kvConfig.behavior?.optimisticLockRetries ?? DEFAULT_RETRY_ATTEMPTS;

    const key = rateLimitKvTemplate(request.path, request.identifier);
    const now = Date.now();

    /*
     * IMPORTANT: KV-based rate limiting has inherent race condition risks
     *
     * Cloudflare KV is eventually consistent and does not support atomic operations.
     * This implementation uses optimistic locking (version field) to reduce the race
     * condition window from ~50ms to ~5ms, but cannot eliminate it completely.
     *
     * Current mitigation: Retry with version checking (best effort)
     */

    try {
      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt < maxRetries) {
        attempt++;

        try {
          // Get current rate limit data with metadata
          const kvValue = await kv.getWithMetadata<RateLimitMetadata>(key);
          let metadata: RateLimitMetadata;
          let previousVersion: number;

          if (kvValue.metadata && isValidRateLimitMetadata(kvValue.metadata)) {
            metadata = kvValue.metadata;
            previousVersion = metadata.version;

            // Check if window has expired
            if (now >= metadata.resetAt) {
              // Reset the window
              metadata = {
                count: 1,
                resetAt: now + windowMs,
                version: previousVersion + 1,
              };
            } else {
              // Check if already blocked - skip write optimization (if enabled)
              const skipWriteWhenBlocked = kvConfig.behavior?.skipWriteWhenBlocked ?? true;
              if (skipWriteWhenBlocked && metadata.count > maxRequests) {
                // Already exceeded limit, return without incrementing
                const response: RateLimitResponse = {
                  allowed: false,
                  remaining: 0,
                  resetAt: metadata.resetAt,
                  retryAfter: Math.ceil((metadata.resetAt - now) / 1000),
                };
                return response;
              }

              // Increment counter
              metadata = {
                count: metadata.count + 1,
                resetAt: metadata.resetAt,
                version: previousVersion + 1,
              };
            }
          } else {
            // First request in window OR corrupted data - reset
            metadata = {
              count: 1,
              resetAt: now + windowMs,
              version: 1,
            };
            previousVersion = 0;
          }

          // Check if limit exceeded
          const allowed = metadata.count <= maxRequests;
          const remaining = Math.max(0, maxRequests - metadata.count);

          // Store updated data with TTL using metadata API
          const calculatedTtl = Math.ceil((metadata.resetAt - now) / 1000);
          const ttl = Math.max(KV_MINIMUM_TTL, calculatedTtl);

          // Use empty string as value, store data in metadata for performance
          await kv.put(key, '', {
            expirationTtl: ttl,
            metadata: metadata,
          });

          // Verify version hasn't changed (optimistic locking check)
          // Note: This is best-effort as KV doesn't guarantee consistency
          const verifyValue = await kv.getWithMetadata<RateLimitMetadata>(key);
          if (verifyValue.metadata && isValidRateLimitMetadata(verifyValue.metadata) && verifyValue.metadata.version !== metadata.version && verifyValue.metadata.version !== previousVersion) {
            // Version conflict detected - retry
            throw new Error('Version conflict detected - concurrent write');
          }

          const response: RateLimitResponse = {
            allowed,
            remaining,
            resetAt: metadata.resetAt,
            retryAfter: allowed ? undefined : Math.ceil((metadata.resetAt - now) / 1000),
          };

          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
            continue;
          }

          // Max retries exceeded
          throw lastError;
        }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError || new Error('Failed to check rate limit after retries');
    } catch (error) {
      return err(
        'Failed to check rate limit',
        {
          key,
          path: request.path,
          identifier: request.identifier,
          maxRequests,
          windowMs,
        },
        { cause: error }
      );
    }
  },

  async resetLimit(identifier: string, config: RateLimiterProviderConfig, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
    // Type guard: Ensure this is a KV provider config
    if (config.type !== 'kv') {
      return err('Invalid provider type for KV rate limiter', {
        expectedType: 'kv',
        actualType: config.type,
        providerId: config.id,
      });
    }

    const kvConfig = config as KvProviderConfig;

    // Validate KV binding configuration
    if (!isKvRateLimiterOptions(kvConfig.options)) {
      return err('KV binding not configured for rate limiting', {
        providerId: kvConfig.id,
        identifier,
      });
    }

    const kvOptions = kvConfig.options;

    // Get the KV namespace from context using the configured binding
    const kv = getKVStore(context, kvOptions.kvBinding);

    if (!kv) {
      return err(`KV namespace '${kvOptions.kvBinding}' not found in bindings`, {
        kvBinding: kvOptions.kvBinding,
        providerId: kvConfig.id,
        identifier,
      });
    }

    try {
      // Find all rate limit keys for this identifier using KV list operations
      let deletedCount = 0;
      let cursor: string | undefined;
      let listComplete = false;

      while (!listComplete) {
        // List keys with pagination (using fixed KV prefix)
        const listResult = await kv.list({ prefix: KV_KEY_PREFIX, cursor });

        // Filter keys that match this identifier (keys end with :identifier)
        const keysToDelete = listResult.keys.filter((keyInfo: { name: string }) => keyInfo.name.endsWith(`:${identifier}`)).map((keyInfo: { name: string }) => keyInfo.name);

        // Delete matching keys in batch
        await Promise.all(keysToDelete.map((key: string) => kv.delete(key)));

        deletedCount += keysToDelete.length;

        // Check if pagination is complete
        listComplete = listResult.list_complete;
        cursor = listComplete ? undefined : listResult.keys[listResult.keys.length - 1]?.name;
      }

      // Return success (void)
      return;
    } catch (error) {
      return err(
        'Failed to reset rate limit',
        {
          identifier,
          operation: 'resetLimit',
        },
        { cause: error }
      );
    }
  },
};
