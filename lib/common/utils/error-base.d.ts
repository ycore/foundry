interface BaseErrorProps<T extends string> {
    kind: T;
    message: string;
    cause?: unknown;
}
export declare class BaseError<T extends string> extends Error {
    kind: T;
    cause: unknown;
    constructor(kind: T, message: string, cause?: unknown);
    constructor(props: BaseErrorProps<T>);
}
export {};
//# sourceMappingURL=error-base.d.ts.map