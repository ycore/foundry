import { loadConfig } from '../../config/load-config.js';
import defaultAuthConfig from './auth-config.js';
/**
 * Resolves the authentication configuration lazily.
 * @returns {Promise<AuthConfig>} A promise that resolves to the authentication configuration.
 */
export const resolveAuthConfig = (() => {
    let lazyConfigInstancePromise;
    return async () => {
        if (!lazyConfigInstancePromise) {
            const customConfig = import.meta.env?.AUTH_CONFIG;
            lazyConfigInstancePromise = Promise.resolve(loadConfig(defaultAuthConfig, customConfig));
        }
        return await lazyConfigInstancePromise;
    };
})();
//# sourceMappingURL=resolve-config.js.map