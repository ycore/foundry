import type { AppLoadContext } from 'react-router';
export type EnvKey = keyof Env;
export type EnvCollection = Array<EnvKey>;
export declare function validateEnvironment(context: AppLoadContext): void;
export declare function contextEnv(context: AppLoadContext): Env;
export declare const isDev: (context: AppLoadContext) => boolean;
export declare const isProduction: (context: AppLoadContext) => boolean;
export declare const isTesting: (context: AppLoadContext) => boolean;
//# sourceMappingURL=env.d.ts.map