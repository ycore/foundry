import { loadConfig } from '../../config/load-config.js';
import defaultAuthConfig, { type AuthConfig } from './auth-config.js';
/**
 * Resolves the authentication configuration lazily.
 * @returns {Promise<AuthConfig>} A promise that resolves to the authentication configuration.
 */
export const resolveAuthConfig = (() => {
  let lazyConfigInstancePromise: Promise<AuthConfig>;

  return async () => {
    if (!lazyConfigInstancePromise) {
      const customConfig = import.meta.env?.AUTH_CONFIG;
      lazyConfigInstancePromise = Promise.resolve(loadConfig<AuthConfig>(defaultAuthConfig, customConfig));
    }
    return await lazyConfigInstancePromise;
  };
})();

export type AuthConfigPromise = Awaited<ReturnType<typeof resolveAuthConfig>>;
