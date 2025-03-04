export type SafeResponse<D, E = Error> = [undefined, E] | [D, null];
export declare function go<D>(promise: Promise<D>, throwNative?: boolean): Promise<SafeResponse<D>>;
export declare function go<D>(fn: () => D, throwNative?: boolean): SafeResponse<D>;
//# sourceMappingURL=go-safe.d.ts.map