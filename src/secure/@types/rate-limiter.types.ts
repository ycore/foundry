/**
 * Rate Limiter Types
 * Type definitions for KV-based rate limiting
 */

export interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  kv: KVNamespace;
}

export interface RateLimitInfo {
  isLimited: boolean;
  remaining: number;
  reset: number;
}

export interface RateLimitData {
  remaining: number;
  reset: number;
}
