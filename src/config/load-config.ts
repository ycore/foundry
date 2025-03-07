export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export function configFactory<T extends object>(defaultConfig: T) {
  let cachedConfig: T | null = null;

  return {
    getConfig: async (options?: { customConfig?: DeepPartial<T>; configPath?: string }): Promise<T> => {
      if (cachedConfig) return cachedConfig;
      cachedConfig = await loadConfig(defaultConfig, options);
      return cachedConfig;
    },
    clearCache: () => {
      cachedConfig = null;
    },
  };
}

export async function loadConfig<T extends object>(defaultConfig: T, options?: { customConfig?: DeepPartial<T>; configPath?: string }): Promise<T> {
  let merged = deepMerge(defaultConfig, options?.customConfig);
  if (options?.configPath) {
    try {
      const fileConfig = await import(/* @vite-ignore */ options.configPath);
      merged = deepMerge(merged, fileConfig.default);
    } catch (error) {
      console.error(error.message);
      if (!(error instanceof Error && error.message.includes('Cannot find'))) {
        console.error('Config load error:', error);
      }
    }
  }

  return merged;
}

export function deepMerge<T extends object>(defaults: T, overrides?: DeepPartial<T>): T {
  if (!overrides) return { ...defaults };
  // biome-ignore lint/suspicious/noExplicitAny:
  const result = { ...defaults } as Record<string, any>;
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value);
    } else {
      result[key] = value ?? result[key];
    }
  }

  return result as T;
}
