// https://betterprogramming.pub/typescript-with-go-rust-errors-no-try-catch-heresy-da0e43ce5f78
// https://github.com/mpiorowski/rusve/server/src/lib/safe.js
// https://github.com/scopsy/await-to-js
const NATIVE_EXCEPTIONS = [EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError];
// Implementation
export function go(promiseOrFunc, throwNative = false) {
    return promiseOrFunc instanceof Promise ? goAsync(promiseOrFunc, throwNative) : goSync(promiseOrFunc, throwNative);
}
async function goAsync(promise, throwNative) {
    try {
        return [await promise, null];
    }
    catch (e) {
        return returnException(e, throwNative);
    }
}
function goSync(func, throwNative) {
    try {
        // return [fn(), null];
        const result = func();
        return [result, null];
    }
    catch (e) {
        return returnException(e, throwNative);
    }
}
function returnException(e, throwNative) {
    if (throwNative && NATIVE_EXCEPTIONS.some((Exception) => e instanceof Exception)) {
        throw e;
    }
    return [undefined, e];
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
//# sourceMappingURL=go-safe.js.map