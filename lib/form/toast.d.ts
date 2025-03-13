import type { AppLoadContext } from 'react-router';
import { toast } from '../vendor/toast.js';
export type ToastMessage = toast.ToastMessage;
export declare function createToaster(context: AppLoadContext, request: Request): Promise<{
    toast: toast.ToastMessage | undefined;
    headers: Headers;
}>;
export declare function useToastNotification(toastMessage: toast.ToastMessage | undefined): void;
//# sourceMappingURL=toast.d.ts.map