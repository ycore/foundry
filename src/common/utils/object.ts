export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type FlexiblePartial<T> = { [K in keyof T]?: T[K] extends object ? FlexiblePartial<T[K]> : T[K] } & {
  [key: string]: unknown;
};

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
