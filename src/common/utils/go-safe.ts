// https://betterprogramming.pub/typescript-with-go-rust-errors-no-try-catch-heresy-da0e43ce5f78
// https://github.com/mpiorowski/rusve/server/src/lib/safe.js
// https://github.com/scopsy/await-to-js

const NATIVE_EXCEPTIONS = [EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError];

export type SafeResponse<D, E = Error> = [undefined, E] | [D, null];
// Overloads
// eslint-disable-next-line no-unused-vars
export function go<D>(promise: Promise<D>, throwNative?: boolean): Promise<SafeResponse<D>>;
// eslint-disable-next-line no-unused-vars
export function go<D>(fn: () => D, throwNative?: boolean): SafeResponse<D>;
// Implementation
export function go<D>(promiseOrFunc: Promise<D> | (() => D), throwNative: boolean = false): Promise<SafeResponse<D>> | SafeResponse<D> {
  return promiseOrFunc instanceof Promise ? goAsync(promiseOrFunc, throwNative) : goSync(promiseOrFunc, throwNative);
}

async function goAsync<D>(promise: Promise<D>, throwNative: boolean): Promise<SafeResponse<D>> {
  try {
    return [await promise, null];
  } catch (e) {
    return returnException(e, throwNative);
  }
}

function goSync<D>(func: () => D, throwNative: boolean): SafeResponse<D> {
  try {
    // return [fn(), null];
    const result = func();
    return [result, null];
  } catch (e) {
    return returnException(e, throwNative);
  }
}

function returnException(e: unknown, throwNative: boolean): [undefined, Error] {
  if (throwNative && NATIVE_EXCEPTIONS.some((Exception) => e instanceof Exception)) {
    throw e;
  }
  return [undefined, e as Error];
}

/*
const NATIVE_EXCEPTIONS = [EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError];

export type SafeResponse<D, E = Error> = [undefined, E] | [D, null];
export function go<D>(promise: Promise<D>): Promise<SafeResponse<D>>;
export function go<D>(fn: () => D): SafeResponse<D>;
export function go<D>(promiseOrFunc: Promise<D> | (() => D)): Promise<SafeResponse<D>> | SafeResponse<D> {
  return promiseOrFunc instanceof Promise ? goAsync(promiseOrFunc) : goSync(promiseOrFunc);
}

async function goAsync<D>(promise: Promise<D>): Promise<SafeResponse<D>> {
  try {
    return [await promise, null];
  } catch (e) {
    return returnException(e);
  }
}

function goSync<D>(fn: () => D): SafeResponse<D> {
  try {
    return [fn(), null];
  } catch (e) {
    return returnException(e);
  }
}

function returnException(e: unknown): [undefined, Error] {
  if (NATIVE_EXCEPTIONS.some((Exception) => e instanceof Exception)) {
    throw e;
  }
  return [undefined, e as Error];
}
*/
