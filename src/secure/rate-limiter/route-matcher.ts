import type { RateLimiterConfig, RateLimiterProviderConfig, RouteRateLimitConfig } from './@types/rate-limiter.types';

/**
 * Convert glob pattern to regex for route matching
 */
function globToRegex(pattern: string): RegExp {
  // First escape special regex characters except * and /
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // Then handle wildcards: ** for any depth, * for single segment
  const regex = escaped
    .replace(/\*\*/g, '___DOUBLE_STAR___') // Temporary placeholder
    .replace(/\*/g, '[^/]*') // Single * matches anything except /
    .replace(/___DOUBLE_STAR___/g, '.*'); // ** matches anything including /
  return new RegExp(`^${regex}$`);
}

/**
 * Check if a path matches a route pattern
 */
export function matchesRoute(path: string, pattern: string): boolean {
  if (pattern === path) return true;
  if (!pattern.includes('*')) return false;

  const regex = globToRegex(pattern);
  return regex.test(path);
}

/**
 * Find the most specific route configuration for a given path
 * Returns the route config with the longest matching pattern
 */
export function findRouteConfig(path: string, routes: RouteRateLimitConfig[]): RouteRateLimitConfig | null {
  let bestMatch: RouteRateLimitConfig | null = null;
  let bestMatchLength = 0;

  for (const route of routes) {
    if (matchesRoute(path, route.pattern)) {
      // Prefer more specific patterns (longer non-wildcard parts)
      const specificityScore = route.pattern.replace(/\*/g, '').length;
      if (specificityScore > bestMatchLength) {
        bestMatch = route;
        bestMatchLength = specificityScore;
      }
    }
  }

  return bestMatch;
}

/**
 * Get effective rate limit configuration for a specific request
 * Merges global provider config with route-specific overrides
 */
export function getEffectiveRateLimitConfig(
  config: RateLimiterConfig,
  path: string,
  method: string
): {
  providerConfig: RateLimiterProviderConfig;
  keyPrefix?: string;
} | null {
  const globalProviderConfig = config.providers.find(p => p.name === config.active);
  if (!globalProviderConfig) return null;

  // Check if path should be skipped entirely
  if (config.conditions?.skipPaths?.some(skipPath => matchesRoute(path, skipPath))) {
    return null;
  }

  // Check if method should be rate limited
  const allowedMethods = config.conditions?.methods || ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!allowedMethods.includes(method)) {
    return null;
  }

  // Find route-specific configuration
  const routeConfig = config.routes ? findRouteConfig(path, config.routes) : null;

  if (routeConfig) {
    // Check if method is allowed for this specific route
    if (routeConfig.methods && !routeConfig.methods.includes(method)) {
      return null;
    }

    // Merge global and route-specific configurations
    return {
      providerConfig: {
        ...globalProviderConfig,
        maxRequests: routeConfig.maxRequests ?? globalProviderConfig.maxRequests,
        windowMs: routeConfig.windowMs ?? globalProviderConfig.windowMs,
      },
      keyPrefix: routeConfig.keyPrefix,
    };
  }

  // Return global configuration
  return {
    providerConfig: globalProviderConfig,
  };
}
