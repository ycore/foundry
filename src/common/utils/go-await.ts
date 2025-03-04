// https://github.com/scopsy/await-to-js
/**
 * @param { Promise } promise
 * @param { Object= } errorExt - Additional Information you can pass to the err object
 * @return { Promise }
 */
export default function go<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U, undefined] | [null, T]> {
  const NATIVE_EXCEPTIONS = [EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError];

  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
      for (const Exception of NATIVE_EXCEPTIONS) {
        if (typeof Exception === 'function' && err instanceof Exception) {
          throw err;
        }
      }

      if (errorExt) {
        const parsedError = Object.assign({}, err, errorExt);
        return [parsedError, undefined];
      }

      return [err, undefined];
    });
}
