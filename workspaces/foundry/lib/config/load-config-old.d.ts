export type ConfigPartial<T> = {
    [P in keyof T]?: T[P] extends object ? ConfigPartial<T[P]> : T[P];
};
interface CustomConfig {
    custom?: {
        filepath?: string;
    };
}
export declare function loadConfig<T extends CustomConfig>(defaultConfig: T, customConfig: T): Promise<T>;
export declare function loadConfigFile<T>(filePath: string): Promise<ConfigPartial<T>>;
export declare function mergeConfigs<T extends object>(base: T, override: ConfigPartial<T>): T;
export {};
//# sourceMappingURL=load-config-old.d.ts.map