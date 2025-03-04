interface BaseErrorProps<T extends string> {
  kind: T;
  message: string;
  cause?: unknown;
}

export class BaseError<T extends string> extends Error {
  kind: T;
  cause: unknown;

  // eslint-disable-next-line no-unused-vars
  constructor(kind: T, message: string, cause?: unknown);
  // eslint-disable-next-line no-unused-vars
  constructor(props: BaseErrorProps<T>);
  constructor(arg1: T | BaseErrorProps<T>, arg2?: string, arg3?: unknown) {
    if (typeof arg1 === 'object') {
      const { kind, message, cause } = arg1;
      super(message);
      this.kind = kind;
      this.cause = cause;
    } else {
      super(arg2);
      this.kind = arg1;
      this.cause = arg3;
    }

    Object.setPrototypeOf(this, BaseError.prototype);
  }
}
