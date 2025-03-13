import { useEffect } from 'react';
import { contextEnv } from '../common/services/env.js';
import { notify, toast } from '../vendor/toast.js';
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
                notify.toast.error(toastMessage.message);
            }
            else if (toastMessage.type === 'success') {
                notify.toast.success(toastMessage.message);
            }
        }
    }, [toastMessage]);
}
//# sourceMappingURL=toast.js.map