/**
 * @param { Promise } promise
 * @param { Object= } errorExt - Additional Information you can pass to the err object
 * @return { Promise }
 */
export default function go<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U, undefined] | [null, T]>;
//# sourceMappingURL=go-await.d.ts.map