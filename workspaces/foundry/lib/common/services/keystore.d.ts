interface KvStore {
    delete: (store: KVNamespace, key: string) => Promise<void>;
    get: (store: KVNamespace, key: string, secret?: string) => Promise<unknown>;
    list: (store: KVNamespace, options?: KVNamespaceListOptions) => Promise<unknown>;
    put: (store: KVNamespace, key: string, payload: unknown, secret?: string) => Promise<string>;
}
export declare const kvStore: KvStore;
export {};
//# sourceMappingURL=keystore.d.ts.map