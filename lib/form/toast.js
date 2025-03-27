import { useEffect } from 'react';
import { contextEnv } from '../common/services/env.js';
import { toast, toaster } from './vendor.js';
export async function createToaster(context, request) {
    const toastSecret = contextEnv(context).TOAST_COOKIE_SECRET_KEY;
    toast.setToastCookieOptions({
        name: '_message',
        secrets: [toastSecret],
    });
    return await toast.getToast(request);
}
export function useToastNotification(toastMessage) {
    useEffect(() => {
        if (toastMessage) {
            if (toastMessage.type === 'error') {
                toaster.error(toastMessage.message);
            }
            else if (toastMessage.type === 'success') {
                toaster.success(toastMessage.message);
            }
        }
    }, [toastMessage]);
}
