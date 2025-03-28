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
        const result = func();
        return [result, null];
    }
    catch (e) {
        return returnException(e, throwNative);
    }
}
function returnException(e, throwNative) {
    if (throwNative && NATIVE_EXCEPTIONS.some(Exception => e instanceof Exception)) {
        throw e;
    }
    return [undefined, e];
}
// https://github.com/scopsy/await-to-js
// export default function go<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U, undefined] | [null, T]> {
//   const NATIVE_EXCEPTIONS = [EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError];
//   return promise
//     .then<[null, T]>((data: T) => [null, data])
//     .catch<[U, undefined]>((err: U) => {
//       for (const Exception of NATIVE_EXCEPTIONS) {
//         if (typeof Exception === 'function' && err instanceof Exception) {
//           throw err;
//         }
//       }
//       if (errorExt) {
//         const parsedError = Object.assign({}, err, errorExt);
//         return [parsedError, undefined];
//       }
//       return [err, undefined];
//     });
// }
