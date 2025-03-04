import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfigFile, mergeConfigs } from '../load-config';

describe('loadConfigFile', () => {
  it('should load config file successfully', async () => {
    const expectedConfig = {
      routes: {
        landing: '/',
        auth: {
          signin: '/signin',
          signout: '/signout',
          validate: '/validate',
          verify: '/verify',
        },
      },
    };
    const fileTestPath1 = path.resolve(__dirname, './index.js');

    const config = await loadConfigFile(fileTestPath1);
    expect(config).toEqual(expectedConfig);
  });

  it('should return an empty object on failure', async () => {
    const fileTestPath2 = 'invalid/path/to/config';

    const config = await loadConfigFile(fileTestPath2);
    expect(config).toEqual({});
  });
});

describe('mergeConfigs', () => {
  it('should merge two config objects', () => {
    const defaultConfig = { a: 1, b: { c: 2 } };
    const customConfig = { b: { d: 3 }, e: 4 };

    const merged = mergeConfigs(defaultConfig, customConfig);
    expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it('should return custom config if default is not an object', () => {
    const defaultConfig = null;
    const customConfig = { a: 1 };

    // @ts-expect-error TODO: default config file is empty
    const merged = mergeConfigs(defaultConfig, customConfig);
    expect(merged).toEqual(customConfig);
  });

  it('should return default config if custom is not an object', () => {
    const defaultConfig = { a: 1 };
    const customConfig = null;

    // @ts-expect-error TODO: default config file is empty
    const merged = mergeConfigs(defaultConfig, customConfig);
    expect(merged).toEqual(defaultConfig);
  });
});
