import type { AppResult } from '@ycore/forge/result';
import type { KVBindingNames } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

export type RouteRateLimitConfig = {
  pattern: string; // Route pattern to match (e.g., '/auth/**', '/api/sensitive/**')
  maxRequests?: number;
  windowMs?: number;
  methods?: string[]; // HTTP methods to apply rate limiting to
  keyPrefix?: string; // Custom prefix for rate limit keys
};

export type RateLimiterConfig = {
  active: 'kv' | 'cloudflare' | 'none';
  providers: RateLimiterProviderConfig[];
  routes?: RouteRateLimitConfig[]; // Route-specific configurations
  conditions?: {
    methods?: string[]; // Default methods to rate limit (e.g., ['POST', 'PUT', 'DELETE'])
    skipPaths?: string[]; // Paths to skip rate limiting entirely
  };
};

export type KvRateLimiterOptions = {
  kvBinding: KVBindingNames; // The KV namespace binding name
};

export type CloudflareRateLimiterOptions = {
  limiterBinding?: string; // Future: Cloudflare rate limiter binding
};

export type RateLimiterProviderConfig = {
  name: 'kv' | 'cloudflare';
  maxRequests?: number;
  windowMs?: number;
  options?: KvRateLimiterOptions | CloudflareRateLimiterOptions;
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
  checkLimit: (request: RateLimitRequest, config: RateLimiterProviderConfig, context: RouterContextProvider) => Promise<AppResult<RateLimitResponse>>;
  resetLimit?: (identifier: string, config: RateLimiterProviderConfig, context: RouterContextProvider) => Promise<AppResult<void>>;
};
