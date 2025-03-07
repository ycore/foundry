export function configFactory(defaultConfig) {
    let cachedConfig = null;
    return {
        getConfig: async (options) => {
            if (cachedConfig)
                return cachedConfig;
            cachedConfig = await loadConfig(defaultConfig, options);
            return cachedConfig;
        },
        clearCache: () => {
            cachedConfig = null;
        },
    };
}
export async function loadConfig(defaultConfig, options) {
    let merged = deepMerge(defaultConfig, options?.customConfig);
    if (options?.configPath) {
        try {
            const fileConfig = await import(/* @vite-ignore */ options.configPath);
            merged = deepMerge(merged, fileConfig.default);
        }
        catch (error) {
            console.error(error.message);
            if (!(error instanceof Error && error.message.includes('Cannot find'))) {
                console.error('Config load error:', error);
            }
        }
    }
    return merged;
}
export function deepMerge(defaults, overrides) {
    if (!overrides)
        return { ...defaults };
    // biome-ignore lint/suspicious/noExplicitAny:
    const result = { ...defaults };
    for (const [key, value] of Object.entries(overrides)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = deepMerge(result[key] || {}, value);
        }
        else {
            result[key] = value ?? result[key];
        }
    }
    return result;
}
//# sourceMappingURL=load-config.js.map