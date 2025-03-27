import type { KVNamespace, KVNamespaceListOptions } from '@cloudflare/workers-types';
import { type JwtPayload } from '@tsndr/cloudflare-worker-jwt';
interface KvStore {
    delete: (store: KVNamespace, key: string) => Promise<void>;
    get: (store: KVNamespace, key: string, secret?: string) => Promise<unknown>;
    list: (store: KVNamespace, options?: KVNamespaceListOptions) => Promise<unknown>;
    put: (store: KVNamespace, key: string, payload: JwtPayload<KVNamespace> | string, secret?: string) => Promise<string | null>;
}
export declare const kvStore: KvStore;
export {};
