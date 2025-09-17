import type { Result } from '@ycore/forge/result';
import { err, isError } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import type { RateLimiterConfig, RateLimiterProvider, RateLimiterProviderConfig, RateLimitRequest, RateLimitResponse } from './@types/rate-limiter.types';
import { cloudflareRateLimiter } from './providers/cloudflare-rate-limiter';
import { kvRateLimiter } from './providers/kv-rate-limiter';

const rateLimiterProviders: Record<string, RateLimiterProvider> = {
  kv: kvRateLimiter,
  cloudflare: cloudflareRateLimiter,
};

/**
 * Get rate limiter provider names from config
 */
export function getRateLimiterProviderNames(config: RateLimiterConfig): string[] {
  return config.providers.map(provider => provider.name);
}

/**
 * Get provider configuration by name
 */
export function getProviderConfig(config: RateLimiterConfig, providerName: string): RateLimiterProviderConfig | null {
  return config.providers.find(provider => provider.name === providerName) || null;
}

/**
 * Create a rate limiter provider instance
 */
export function createRateLimiterProvider(providerName: string): Result<RateLimiterProvider> {
  const provider = rateLimiterProviders[providerName];

  if (!provider) {
    const availableProviders = Object.keys(rateLimiterProviders).join(', ');
    return err(`Unknown rate limiter provider: ${providerName}. Available: ${availableProviders}`);
  }

  return provider;
}

/**
 * Check rate limit using the active provider
 */
export async function checkRateLimit(config: RateLimiterConfig, request: RateLimitRequest, context: RouterContextProvider): Promise<Result<RateLimitResponse>> {
  if (config.active === 'none') {
    // No rate limiting enabled
    return {
      allowed: true,
      remaining: 999,
      resetAt: Date.now() + 60000,
    };
  }

  const providerConfig = getProviderConfig(config, config.active);
  if (!providerConfig) {
    return err(`Provider configuration not found for: ${config.active}`);
  }

  const providerResult = createRateLimiterProvider(config.active);
  if (isError(providerResult)) {
    return providerResult;
  }

  return await providerResult.checkLimit(request, providerConfig, context);
}
