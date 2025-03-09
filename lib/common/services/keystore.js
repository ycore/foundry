import { decode, sign, verify } from '@tsndr/cloudflare-worker-jwt';
const jwt = { decode, sign, verify };
const isValidKVStore = (store) => {
    return store && typeof store.get === 'function' && typeof store.put === 'function' && typeof store.delete === 'function' && typeof store.list === 'function';
};
export const kvStore = {
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
            const encodedPayload = await jwt.sign(payload, secret);
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
            if (!tokenToVerify)
                return null;
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
//# sourceMappingURL=keystore.js.map