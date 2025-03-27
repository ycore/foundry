export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type FlexiblePartial<T> = {
    [K in keyof T]?: T[K] extends object ? FlexiblePartial<T[K]> : T[K];
} & {
    [key: string]: unknown;
};
export declare function deepMerge<T extends object>(defaults: T, overrides?: DeepPartial<T>): T;
