import { configFactory } from '../../config/load-config';
import { default as authConfig } from './config.auth';
export const getAuthConfig = async () => {
    const authConfigLoader = configFactory(authConfig);
    return await authConfigLoader.getConfig({ configPath: '/@config/config.auth.ts' });
};
//# sourceMappingURL=auth-config.js.map