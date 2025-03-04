const configInstances = new Map();
export async function loadConfig(defaultConfig, customConfig) {
    const configKey = JSON.stringify(defaultConfig);
    if (configInstances.has(configKey)) {
        return configInstances.get(configKey);
    }
    let config = defaultConfig;
    config = mergeConfigs(config, customConfig);
    configInstances.set(configKey, config);
    return config;
}
export async function loadConfigFile(filePath) {
    try {
        const module = await import(/* @vite-ignore */ filePath);
        return (module?.default || module || {});
    }
    catch (err) {
        console.warn(`Failed to load config file at ${filePath}:`, err);
        return {};
    }
}
export function mergeConfigs(base, override) {
    if (!override || typeof override !== 'object')
        return base;
    if (!base || typeof base !== 'object')
        return override;
    const merged = { ...base };
    for (const key in override) {
        if (Object.prototype.hasOwnProperty.call(override, key)) {
            const baseValue = base[key];
            const overrideValue = override[key];
            if (baseValue && overrideValue && typeof baseValue === 'object' && typeof overrideValue === 'object') {
                merged[key] = mergeConfigs(baseValue, overrideValue);
            }
            else if (overrideValue !== undefined) {
                merged[key] = overrideValue;
            }
        }
    }
    return merged;
}
//# sourceMappingURL=load-config.js.map