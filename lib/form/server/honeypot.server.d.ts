import type { AppLoadContext } from 'react-router';
import { Honeypot } from 'remix-utils/honeypot/server';
export declare function createHoneypot(context: AppLoadContext): Honeypot;
export declare function checkHoneypot(context: AppLoadContext, formData: FormData): Promise<void>;
