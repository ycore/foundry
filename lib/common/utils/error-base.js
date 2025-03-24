export class BaseError extends Error {
    kind;
    cause;
    constructor(arg1, arg2, arg3) {
        if (typeof arg1 === 'object') {
            const { kind, message, cause } = arg1;
            super(message);
            this.kind = kind;
            this.cause = cause;
        }
        else {
            super(arg2);
            this.kind = arg1;
            this.cause = arg3;
        }
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}
//# sourceMappingURL=error-base.js.map