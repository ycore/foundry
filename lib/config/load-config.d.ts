export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export declare function configFactory<T extends object>(defaultConfig: T): {
    getConfig: (options?: {
        customConfig?: DeepPartial<T>;
        configPath?: string;
    }) => Promise<T>;
    clearCache: () => void;
};
export declare function loadConfig<T extends object>(defaultConfig: T, options?: {
    customConfig?: DeepPartial<T>;
    configPath?: string;
}): Promise<T>;
export declare function deepMerge<T extends object>(defaults: T, overrides?: DeepPartial<T>): T;
//# sourceMappingURL=load-config.d.ts.map