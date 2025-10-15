import { SpriteIcon } from '@ycore/componentry/images';
import type { IconName } from '@ycore/componentry/vibrant';
import { Button, Card, Input, Link, Spinner } from '@ycore/componentry/vibrant';
import svgSpriteUrl from '@ycore/componentry/vibrant/assets/lucide-sprites.svg?url';
import { isError } from '@ycore/forge/result';
import clsx from 'clsx';
import * as React from 'react';
import { useActionData, useLoaderData, useNavigation, useSubmit } from 'react-router';
import { FormError, FormField } from '../../secure/csrf/form';
import { SecureForm } from '../../secure/csrf/SecureForm';
import { SecureProvider } from '../../secure/csrf/SecureProvider';
import type { SignInFormProps, SignInPageProps } from '../@types/auth.component.types';
import { createAuthenticationOptions } from '../services/webauthn';
import { isPlatformAuthenticatorAvailable, isWebAuthnSupported, startAuthentication } from './webauthn-client';

export function SignInForm({ signupUrl }: SignInFormProps) {
  const navigation = useNavigation();
  const actionData = useActionData<any>();
  const loaderData = useLoaderData<any>();
  const submit = useSubmit();
  const isSubmitting = navigation.state === 'submitting';
  const errors = actionData?.success === false ? actionData.error?.details || {} : {};
  const [webAuthnSupported, setWebAuthnSupported] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const checkWebAuthn = async () => {
      const supported = isWebAuthnSupported();
      setWebAuthnSupported(supported);

      if (supported) {
        // Check if platform authenticator is available
        const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
        setPlatformAuthAvailable(isPlatformAvailable);
      }
    };

    checkWebAuthn();
  }, []);

  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWebAuthnError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email')?.toString();

    if (!email) {
      setWebAuthnError('Email is required');
      return;
    }

    if (!webAuthnSupported) {
      setWebAuthnError('WebAuthn is not supported on this device');
      return;
    }

    if (!loaderData?.challenge) {
      setWebAuthnError('Session expired. Please refresh the page.');
      return;
    }

    try {
      setIsAuthenticating(true);
      setWebAuthnError(null);

      // Create AbortController for this operation
      abortControllerRef.current = new AbortController();

      // Create authentication options
      const options = createAuthenticationOptions(
        window.location.hostname,
        loaderData.challenge,
        [] // Will be populated server-side in the future
      );

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Authentication timed out. Please try again.'));
        }, 60000);

        // Clear timeout if aborted
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
        });
      });

      // Race between WebAuthn authentication and timeout
      const credential = await Promise.race([startAuthentication(options), timeoutPromise]);

      // Check if still mounted and not aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Create new FormData with WebAuthn response
      const submitFormData = new FormData(form);
      submitFormData.append('webauthn_response', JSON.stringify(credential));
      submitFormData.append('intent', 'signin');

      // Submit using React Router's submit function
      submit(submitFormData, { method: 'post' });
    } catch (error) {
      // Check if component is still mounted and operation wasn't aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setIsAuthenticating(false);

      // Provide more specific error messages
      let errorMessage = 'Authentication failed';
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          errorMessage = 'Authentication was cancelled. Please try again when ready.';
        } else if (error.message.includes('timed out')) {
          errorMessage = error.message; // Use the timeout message directly
        } else if (error.message.includes('not found')) {
          errorMessage = 'No authenticator found for this account. Please sign up first.';
        } else {
          errorMessage = error.message;
        }
      }
      setWebAuthnError(errorMessage);
    }
  };

  return (
    <SecureForm method="post" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormField label="Email" error={errors.email}>
        <Input name="email" type="email" placeholder="Enter your email" autoComplete="email webauthn" required autoFocus />
      </FormField>

      {(errors.form || webAuthnError) && <FormError error={errors.form || webAuthnError} />}

      {/* WebAuthn status indicator */}
      {webAuthnSupported && (
        <div className="text-muted-foreground text-sm">
          {platformAuthAvailable ? (
            <span className="flex items-center gap-2">
              <SpriteIcon<IconName> spriteUrl={svgSpriteUrl} iconId="CircleCheck" className="h-4 w-4 text-green-500" />
              Platform authenticator available
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <SpriteIcon<IconName> spriteUrl={svgSpriteUrl} iconId="CircleAlert" className="h-4 w-4 text-yellow-500" />
              External security key may be required
            </span>
          )}
        </div>
      )}

      {/* Authentication in progress indicator */}
      {isAuthenticating && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm">
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span>Please interact with your authenticator...</span>
          </div>
          <p className="mt-1 text-xs">Touch your security key or approve the prompt on your device.</p>
        </div>
      )}

      <div className="flex justify-between gap-x-2">
        <Button type="submit" name="intent" value="signin" disabled={isSubmitting || isAuthenticating || !webAuthnSupported} className="flex-1">
          <Spinner className={clsx('size-5', !(isSubmitting || isAuthenticating) && 'hidden')} />
          {isSubmitting || isAuthenticating ? 'Authenticating...' : !webAuthnSupported ? 'WebAuthn not supported' : 'Sign in with Passkey'}
        </Button>

        <Button type="button" variant="outline" asChild disabled={isSubmitting || isAuthenticating}>
          <Link href={signupUrl}>Sign Up</Link>
        </Button>
      </div>
    </SecureForm>
  );
}

export function SignInPage({ loaderData, children, title = 'Sign In', description = 'Sign in to your account with your passkey' }: SignInPageProps) {
  const csrfData = isError(loaderData) ? null : (loaderData?.csrfData ?? null);

  return (
    <SecureProvider csrfData={csrfData}>
      <div className="mx-auto min-w-md max-w-lg px-4 py-8">
        <Card>
          <Card.Header>
            <Card.Title>{title}</Card.Title>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>{children}</Card.Content>
        </Card>
      </div>
    </SecureProvider>
  );
}
