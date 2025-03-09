import type { KVNamespace, KVNamespaceListOptions } from '@cloudflare/workers-types';
import { type JwtPayload, decode, sign, verify } from '@tsndr/cloudflare-worker-jwt';

interface KvStore {
  // eslint-disable-next-line no-unused-vars
  delete: (store: KVNamespace, key: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  get: (store: KVNamespace, key: string, secret?: string) => Promise<unknown>;
  // eslint-disable-next-line no-unused-vars
  list: (store: KVNamespace, options?: KVNamespaceListOptions) => Promise<unknown>;
  // eslint-disable-next-line no-unused-vars
  put: (store: KVNamespace, key: string, payload: JwtPayload<KVNamespace> | string, secret?: string) => Promise<string | null>;
}

const jwt = { decode, sign, verify };

const isValidKVStore = (store: KVNamespace): store is KVNamespace => {
  return store && typeof store.get === 'function' && typeof store.put === 'function' && typeof store.delete === 'function' && typeof store.list === 'function';
};

export const kvStore: KvStore = {
  list: async (store, options) => {
    if (!isValidKVStore(store)) {
      return null;
    }
    return await store.list(options);
  },
  put: async (store, key, payload, secret) => {
    if (!isValidKVStore(store)) {
      return null;
    }
    if (secret) {
      // biome-ignore lint/suspicious/noExplicitAny:
      const encodedPayload = await jwt.sign(payload as any, secret);
      await store.put(key, encodedPayload);
      return encodedPayload;
    }

    // Check the type and handle accordingly
    const valueToStore = typeof payload === 'string' ? payload : JSON.stringify(payload);

    await store.put(key, valueToStore);
    return typeof payload === 'string' ? payload : valueToStore;
  },
  get: async (store, key, secret) => {
    if (!isValidKVStore(store)) {
      return null;
    }
    if (secret) {
      const tokenToVerify = await store.get(key);
      if (!tokenToVerify) return null;

      const decodedPayload = await verify(tokenToVerify, secret);
      return decodedPayload;
    }
    const payload = (await store.get(key)) || null;
    return payload;
  },
  delete: async (store, key) => {
    if (isValidKVStore(store)) {
      await store.delete(key);
    }
  },
};
