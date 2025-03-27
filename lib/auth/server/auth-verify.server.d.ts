import type { KVNamespace } from '@cloudflare/workers-types';
import type { AppLoadContext } from 'react-router';
import { AuthError } from '../utils/error-auth.js';
export interface TOTPConfig {
    secret?: string;
    kv?: KVNamespace;
    digits?: number;
    period?: number;
    maxAttempts?: number;
}
export type TOTPConfigReq = Required<TOTPConfig>;
export type VerifyActions = 'validate' | 'resend' | 'forgot';
export interface VerifyLinkOptions {
    action: VerifyActions;
    code: string;
    email: string;
}
export declare const assignConfig: (context: AppLoadContext, config?: TOTPConfig) => Promise<Required<TOTPConfig>>;
export declare const authTOTP: {
    create: (email: string, context: AppLoadContext, options?: TOTPConfigReq) => Promise<string>;
    verify: (email: string, code: string, context: AppLoadContext, options?: TOTPConfigReq) => Promise<[AuthError, undefined] | [null, boolean]>;
    link: (linkPath: string, linkRef: VerifyLinkOptions, context: AppLoadContext, request: Request) => Promise<string>;
};
