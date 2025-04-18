/// <reference path="../../../../../@config/cloudflare/worker-configuration.d.ts" />
/// <reference path="../../../../../@config/cloudflare/load-context.ts" />
const initState = {
    completed: false,
    passed: false,
};
export const getInitState = () => ({ ...initState });
export const isDev = (context) => contextEnv(context).ENVIRONMENT === 'development';
export const isProduction = (context) => contextEnv(context).ENVIRONMENT === 'production';
export const isTesting = (context) => contextEnv(context).ENVIRONMENT === 'testing';
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
export async function validateEnvironment(env, init) {
    if (initState.completed) {
        if (!initState.passed) {
            throw new Error('Application initialization failed. See logs for details.');
        }
        return;
    }
    try {
        const [envCheckPassed, dbCheckPassed] = await Promise.all([validateVariables(env, init.env), validateDatabases(env, init.database)]);
        if (!envCheckPassed) {
            initState.passed = false;
            throw new Error('Environment variable validation failed');
        }
        if (!dbCheckPassed) {
            initState.passed = false;
            throw new Error('Database validation failed');
        }
        initState.passed = true;
    }
    catch (error) {
        console.error('Environment validation failed:', error);
        initState.passed = false;
        throw new Error('Application initialization failed. See logs for details.');
    }
    finally {
        initState.completed = true;
    }
}
async function validateVariables(env, envConfig) {
    const excludedEnvVars = new Set(envConfig.exclude);
    const expectedKeys = Object.keys(env);
    for (const key of expectedKeys) {
        if (excludedEnvVars.has(key))
            continue;
        if (env[key] === undefined || env[key] === 'null' || env[key] === '') {
            console.error(`Required environment variable ${String(key)} is missing or undefined`);
            return false;
        }
    }
    return true;
}
async function validateDatabases(env, d1Configs) {
    for (const config of d1Configs) {
        const binding = config.binding;
        const database = env[binding];
        if (!database) {
            console.error(`Required D1 database binding ${String(binding)} is missing`);
            return false;
        }
        for (const tableName of config.tables) {
            try {
                const result = await database.prepare(`PRAGMA table_info(${tableName})`).first();
                if (!result) {
                    console.error(`Required table ${tableName} does not exist in database ${String(binding)}`);
                    return false;
                }
            }
            catch (error) {
                console.error(`Required table ${tableName} doesn't exist or isn't accessible in database ${String(binding)}`);
                return false;
            }
        }
    }
    return true;
}
