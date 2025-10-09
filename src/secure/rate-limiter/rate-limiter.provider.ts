import type { Result } from '@ycore/forge/result';
import { err, isError } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import type { RateLimiterConfig, RateLimiterProvider, RateLimiterProviderConfig, RateLimitRequest, RateLimitResponse } from './@types/rate-limiter.types';
import { cloudflareRateLimiter } from './providers/cloudflare-rate-limiter';
import { kvRateLimiter } from './providers/kv-rate-limiter';

/**
 * Provider type registry
 * Maps provider type to implementation
 */
const rateLimiterProviders: Record<string, RateLimiterProvider> = {
  kv: kvRateLimiter,
  cloudflare: cloudflareRateLimiter,
};

/**
 * Get all configured provider IDs from config
 */
export function getRateLimiterProviderIds(config: RateLimiterConfig): string[] {
  return config.providers.map(provider => provider.id);
}

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(config: RateLimiterConfig, providerId: string): RateLimiterProviderConfig | null {
  return config.providers.find(provider => provider.id === providerId) || null;
}

/**
 * Create a rate limiter provider instance by type
 */
export function createRateLimiterProvider(providerType: string): Result<RateLimiterProvider> {
  const provider = rateLimiterProviders[providerType];

  if (!provider) {
    const availableProviders = Object.keys(rateLimiterProviders).join(', ');
    return err(`Unknown rate limiter provider type: ${providerType}. Available: ${availableProviders}`);
  }

  return provider;
}

/**
 * Check rate limit using a specific provider (by ID)
 */
export async function checkRateLimit(config: RateLimiterConfig, request: RateLimitRequest, context: Readonly<RouterContextProvider>, providerId: string): Promise<Result<RateLimitResponse>> {
  // Get provider configuration by ID
  const providerConfig = getProviderConfig(config, providerId);
  if (!providerConfig) {
    return err(`Provider configuration not found for ID: ${providerId}`, {
      providerId: providerId,
      availableProviders: getRateLimiterProviderIds(config),
    });
  }

  // Create provider instance by type
  const providerResult = createRateLimiterProvider(providerConfig.type);
  if (isError(providerResult)) {
    return providerResult;
  }

  // Execute rate limit check
  return await providerResult.checkLimit(request, providerConfig, context);
}
