import { useEffect } from 'react';
import type { AppLoadContext } from 'react-router';

import { contextEnv } from '../common/services/env.js';
import { notify, toast } from '../vendor/toast.js';

export type ToastMessage = toast.ToastMessage;

export async function createToaster(context: AppLoadContext, request: Request) {
  const toastSecret = contextEnv(context).TOAST_COOKIE_SECRET_KEY;
  toast.setToastCookieOptions({
    name: '_message',
    secrets: [toastSecret],
  });

  return await toast.getToast(request);
}

export function useToastNotification(toastMessage: toast.ToastMessage | undefined) {
  useEffect(() => {
    if (toastMessage) {
      if (toastMessage.type === 'error') {
        notify.toast.error(toastMessage.message);
      } else if (toastMessage.type === 'success') {
        notify.toast.success(toastMessage.message);
      }
    }
  }, [toastMessage]);
}
