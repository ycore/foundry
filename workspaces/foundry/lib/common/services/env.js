export function validateEnvironment(context) {
    const env = context.cloudflare.env;
    const missingKeys = Object.keys(env).filter(key => env[key] === undefined || env[key] === null || key.length === 0);
    if (missingKeys.length > 0) {
        const errorMessage = `Missing environment variables: ${missingKeys.join(', ')}`;
        if (isDev(context)) {
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        throw new Error('Some environment settings are not defined. Please check the logs for details.');
    }
}
export function contextEnv(context) {
    const env = context.cloudflare.env;
    return new Proxy(env, {
        get(target, key) {
            if (!(key in target)) {
                throw new Error(`Environment variable "${key}" is not defined.`);
            }
            const value = target[key];
            if (value === undefined || value === null || String(value).trim().length === 0) {
                throw new Error(`Environment variable "${key}" is missing or invalid.`);
            }
            return value;
        },
    });
}
export const isDev = (context) => contextEnv(context).ENVIRONMENT === 'development';
export const isProduction = (context) => contextEnv(context).ENVIRONMENT === 'production';
export const isTesting = (context) => contextEnv(context).ENVIRONMENT === 'testing';
//# sourceMappingURL=env.js.map