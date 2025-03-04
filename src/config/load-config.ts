export type ConfigPartial<T> = {
  [P in keyof T]?: T[P] extends object ? ConfigPartial<T[P]> : T[P];
};

interface CustomConfig {
  custom?: {
    filepath?: string;
  };
}

const configInstances = new Map<string, unknown>();

export async function loadConfig<T extends CustomConfig>(defaultConfig: T, customConfig: T): Promise<T> {
  const configKey = JSON.stringify(defaultConfig);

  if (configInstances.has(configKey)) {
    return configInstances.get(configKey) as T;
  }

  let config = defaultConfig;
  config = mergeConfigs(config, customConfig);

  configInstances.set(configKey, config);
  return config;
}

export async function loadConfigFile<T>(filePath: string): Promise<ConfigPartial<T>> {
  try {
    const module = await import(/* @vite-ignore */ filePath);
    return (module?.default || module || {}) as ConfigPartial<T>;
  } catch (err) {
    console.warn(`Failed to load config file at ${filePath}:`, err);
    return {} as ConfigPartial<T>;
  }
}

export function mergeConfigs<T extends object>(base: T, override: ConfigPartial<T>): T {
  if (!override || typeof override !== 'object') return base;
  if (!base || typeof base !== 'object') return override as T;

  const merged = { ...base };

  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      const baseValue = base[key];
      const overrideValue = override[key];

      if (baseValue && overrideValue && typeof baseValue === 'object' && typeof overrideValue === 'object') {
        merged[key] = mergeConfigs(baseValue, overrideValue);
      } else if (overrideValue !== undefined) {
        merged[key] = overrideValue as T[Extract<keyof T, string>];
      }
    }
  }

  return merged;
}
