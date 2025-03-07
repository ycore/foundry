import { configFactory } from '../../config/load-config';
import { type AuthConfig, default as authConfig } from './config.auth';

export const getAuthConfig = async (): Promise<AuthConfig> => {
  const authConfigLoader = configFactory(authConfig);
  return await authConfigLoader.getConfig({ configPath: '/@config/config.auth.ts' });
};

export type { AuthConfig };
