import type { CloudflareProviderConfig, KvProviderConfig, RateLimiterConfig } from './@types/rate-limiter.types';

/**
 * Default rate limiter configuration
 *
 * IMPORTANT: This configuration uses 'UNCONFIGURED' placeholders that MUST be
 * replaced by the consuming application in config.system.ts
 *
 * The app is responsible for:
 * - Configuring kvBinding to match a KV namespace from wrangler.jsonc
 * - Configuring limiterBinding to match a RateLimit binding from wrangler.jsonc
 * - Defining explicit route configurations with provider assignments
 *
 * Rate limiting is ONLY applied to routes explicitly configured in the routes array.
 */
export const defaultRateLimiterConfig: RateLimiterConfig = {
  providers: [
    {
      id: 'default-kv',
      type: 'kv',
      options: {
        kvBinding: 'UNCONFIGURED',
      },
      limits: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute window
      },
    } satisfies KvProviderConfig,
    {
      id: 'default-cloudflare',
      type: 'cloudflare',
      options: {
        limiterBinding: 'UNCONFIGURED',
      },
    } satisfies CloudflareProviderConfig,
  ],
  routes: [
    // Example route configuration (uncomment and customize as needed):
    // {
    //   pattern: '/api/**',
    //   provider: 'default-kv',
    //   methods: ['POST', 'PUT', 'DELETE', 'PATCH'],
    // },
  ],
  conditions: {
    skipPaths: ['/favicon.ico'],
  },
};
