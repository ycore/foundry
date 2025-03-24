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
//# sourceMappingURL=object.js.map