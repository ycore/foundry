import { useEffect } from 'react';
import type { AppLoadContext } from 'react-router';

import { contextEnv } from '../common/services/env.js';
import { type ToastMessage, toast, toaster } from './vendor.js';

export async function createToaster(context: AppLoadContext, request: Request) {
  const toastSecret = contextEnv(context).TOAST_COOKIE_SECRET_KEY;
  toast.setToastCookieOptions({
    name: '_message',
    secrets: [toastSecret],
  });

  return await toast.getToast(request);
}

export function useToastNotification(toastMessage: ToastMessage | undefined) {
  useEffect(() => {
    if (toastMessage) {
      if (toastMessage.type === 'error') {
        toaster.error(toastMessage.message);
      } else if (toastMessage.type === 'success') {
        toaster.success(toastMessage.message);
      }
    }
  }, [toastMessage]);
}
