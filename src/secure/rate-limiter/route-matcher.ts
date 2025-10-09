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
 *
 * Determines which provider to use based on route configuration.
 * Returns provider config as-is (no merging) - providers are self-contained.
 */
export function getEffectiveRateLimitConfig(config: RateLimiterConfig, path: string, method: string): { providerConfig: RateLimiterProviderConfig; providerId: string; } | null {
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

  // Determine which provider to use
  const providerId = routeConfig?.provider ?? config.active;

  // Get provider configuration by ID
  const providerConfig = config.providers.find(p => p.id === providerId);
  if (!providerConfig) {
    // Provider not found - skip rate limiting for safety
    return null;
  }

  // Check if method is allowed for this specific route
  if (routeConfig?.methods && !routeConfig.methods.includes(method)) {
    return null;
  }

  // Return provider configuration as-is (no merging needed)
  return { providerConfig, providerId };
}
