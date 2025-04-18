import type { AppLoadContext } from 'react-router';
export interface InitConfig {
    env?: {
        exclude?: string[];
    };
    database?: Array<{
        binding: string;
        tables: string[];
    }>;
}
export declare const getInitState: () => {
    completed: boolean;
    passed: boolean;
};
export declare const isDev: (context: AppLoadContext) => boolean;
export declare const isProduction: (context: AppLoadContext) => boolean;
export declare const isTesting: (context: AppLoadContext) => boolean;
export declare function contextEnv(context: AppLoadContext): Env;
export declare function validateEnvironment(env: Env, init: InitConfig): Promise<void>;
