import type { Result } from '@ycore/forge/result';
import type { KVBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

export type KvRateLimiterOptions = {
  kvBinding: KVBindings; // The KV namespace binding name (must match Cloudflare.Env)
};

export type CloudflareRateLimiterOptions = {
  limiterBinding: string; // The RateLimit binding name (must match Cloudflare.Env)
};

export type KvProviderConfig = {
  id: string; // Unique identifier (e.g., 'kv-admin', 'kv-strict')
  type: 'kv';
  options: KvRateLimiterOptions;
  limits: {
    maxRequests: number; // Maximum requests allowed per window
    windowMs: number; // Time window in milliseconds
  };
  behavior?: {
    optimisticLockRetries?: number; // Number of retry attempts on version conflict (default: 3)
    skipWriteWhenBlocked?: boolean; // Skip KV writes when already rate limited (default: true)
  };
};

export type CloudflareProviderConfig = {
  id: string; // Unique identifier (e.g., 'cf-atomic', 'cf-standard')
  type: 'cloudflare';
  options: CloudflareRateLimiterOptions;
};

/**
 * Discriminated union of provider configurations
 */
export type RateLimiterProviderConfig = KvProviderConfig | CloudflareProviderConfig;

/**
 * Route-specific rate limit configuration
 * Providers define HOW to limit (see KvProviderConfig and CloudflareProviderConfig)
 */
export type RouteRateLimitConfig = {
  pattern: string; // Route pattern to match (e.g., '/auth/**', '/api/sensitive/**')
  provider: string; // ID of provider to use (references RateLimiterProviderConfig.id)
  methods?: string[]; // HTTP methods to apply rate limiting to (e.g., ['POST', 'PUT', 'DELETE'])
};

/**
 * Rate limiter configuration - multiple named providers that can be assigned to routes
 */
export type RateLimiterConfig = {
  active: string; // ID of default provider to use (references RateLimiterProviderConfig.id)
  providers: RateLimiterProviderConfig[];
  routes?: RouteRateLimitConfig[]; // Route-specific configurations
  conditions?: {
    methods?: string[]; // Default methods to rate limit (e.g., ['POST', 'PUT', 'DELETE'])
    skipPaths?: string[]; // Paths to skip rate limiting entirely
  };
};

export type RateLimitRequest = {
  identifier: string; // IP address, user ID, or other identifier
  path: string;
  method: string;
};

export type RateLimitResponse = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
};

export type RateLimiterProvider = {
  name: string;
  checkLimit: (request: RateLimitRequest, config: RateLimiterProviderConfig, context: Readonly<RouterContextProvider>) => Promise<Result<RateLimitResponse>>;
  resetLimit?: (identifier: string, config: RateLimiterProviderConfig, context: Readonly<RouterContextProvider>) => Promise<Result<void>>;
};

export type RateLimitMetadata = {
  count: number;
  resetAt: number;
  version: number; // Optimistic locking version
};
