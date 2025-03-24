import type { AppLoadContext } from 'react-router';
import { type ToastMessage } from './vendor.js';
export declare function createToaster(context: AppLoadContext, request: Request): Promise<{
    toast: ToastMessage | undefined;
    headers: Headers;
}>;
export declare function useToastNotification(toastMessage: ToastMessage | undefined): void;
//# sourceMappingURL=toast.d.ts.map