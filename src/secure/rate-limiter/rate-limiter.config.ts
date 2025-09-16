/** biome-ignore-all lint/suspicious/noExplicitAny: acceptable */
import type { RateLimiterConfig } from './@types/rate-limiter.types';

export const defaultRateLimiterConfig: RateLimiterConfig = {
  active: 'kv',
  providers: [
    {
      name: 'kv',
      maxRequests: 10,      // Default global limit
      windowMs: 60 * 1000,  // 1 minute window
      options: {
        kvBinding: 'invalid_kv_name',
      } as any,
    },
    {
      name: 'cloudflare',
      maxRequests: 10,
      windowMs: 60 * 1000,
      // Options can be added when Cloudflare rate limiter is implemented
    },
  ],
  routes: [],
  conditions: {
    methods: ['POST', 'PUT', 'DELETE', 'PATCH'],
    skipPaths: ['/favicon.ico'],
  },
};
