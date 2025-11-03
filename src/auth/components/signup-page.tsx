import { Button, Card, Input, Link, Spinner, SvgIcon } from '@ycore/componentry/vibrant';
import { formErrors, isError } from '@ycore/forge/result';
import { FormError, FormField, SecureForm, SecureProvider } from '@ycore/foundry/secure';
import clsx from 'clsx';
import * as React from 'react';
import { useActionData, useLoaderData, useNavigation, useSubmit } from 'react-router';
import type { SignUpFormProps, SignUpPageProps } from '../@types/auth.component.types';
import { createRegistrationOptions } from '../server/webauthn';
import { isPlatformAuthenticatorAvailable, isWebAuthnSupported, startRegistration } from './webauthn-client';

export function SignUpForm({ signinUrl, recoverUrl }: SignUpFormProps): React.JSX.Element {
  const navigation = useNavigation();
  const submit = useSubmit();
  const actionData = useActionData<any>();
  const loaderData = useLoaderData<any>();
  const isSubmitting = navigation.state === 'submitting';
  const errors = isError(actionData) ? formErrors(actionData) : {};
  const [webAuthnSupported, setWebAuthnSupported] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState<string | null>(null);
  const [isRegistering, setIsRegistering] = React.useState(false);
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

  // Reset registration state on error
  React.useEffect(() => {
    if (isError(actionData)) {
      setIsRegistering(false);
      setWebAuthnError(null);
    }
  }, [actionData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWebAuthnError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email')?.toString();
    const displayName = formData.get('displayName')?.toString();

    if (!email || !displayName) {
      setWebAuthnError('Email and display name are required');
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
      setIsRegistering(true);
      setWebAuthnError(null);

      // Create AbortController for this operation
      abortControllerRef.current = new AbortController();

      // Create registration options
      const options = createRegistrationOptions(
        window.location.hostname,
        window.location.hostname,
        email,
        displayName,
        loaderData.challenge,
        [] // Exclude credentials (none for new users)
      );

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Registration timed out. Please try again.'));
        }, 60000);

        // Clear timeout if aborted
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
        });
      });

      // Race between WebAuthn registration and timeout
      const credential = await Promise.race([startRegistration(options), timeoutPromise]);

      // Check if still mounted and not aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Create new FormData with WebAuthn response
      const submitFormData = new FormData(form);
      submitFormData.append('webauthn_response', JSON.stringify(credential));
      submitFormData.append('intent', 'signup');

      // Submit using React Router's submit function
      submit(submitFormData, { method: 'post' });
    } catch (error) {
      // Check if component is still mounted and operation wasn't aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setIsRegistering(false);

      // Provide more specific error messages
      let errorMessage = 'Registration failed';
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          errorMessage = 'Registration was cancelled. Please try again when ready.';
        } else if (error.message.includes('timed out')) {
          errorMessage = error.message; // Use the timeout message directly
        } else if (error.message.includes('already registered')) {
          errorMessage = 'This authenticator is already registered. Please sign in instead.';
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

      <FormField label="Display Name" error={errors.displayName}>
        <Input name="displayName" type="text" placeholder="Enter your display name" autoComplete="name" required />
      </FormField>

      {(errors.form || webAuthnError) && <FormError error={errors.form || webAuthnError} />}

      {/* Registration in progress indicator */}
      {isRegistering && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-700 text-sm">
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span>Please set up your authenticator...</span>
          </div>
          <p className="mt-1 text-xs">Follow the prompts to create a passkey on your device.</p>
        </div>
      )}

      <div className="flex items-end justify-between gap-x-2">
        <Button type="submit" name="intent" value="signup" disabled={isSubmitting || isRegistering || !webAuthnSupported} className="flex-1">
          <Spinner className={clsx('size-5', !(isSubmitting || isRegistering) && 'hidden')} />
          {isSubmitting || isRegistering ? 'Creating account...' : !webAuthnSupported ? 'WebAuthn unsupported' : 'Passkey Sign up'}
        </Button>

        <Button type="button" variant="outline" asChild disabled={isSubmitting || isRegistering}>
          <Link href={signinUrl}>Sign In</Link>
        </Button>
      </div>

      {/* WebAuthn status indicator */}
      {webAuthnSupported && (
        <div className="flex justify-between text-muted-foreground text-xs">
          {platformAuthAvailable ? (
            <span className="flex items-center gap-2">
              <SvgIcon iconId="CircleCheck" className="h-4 w-4 text-green-500" />
              Platform authenticator available
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <SvgIcon iconId="CircleAlert" className="h-4 w-4 text-yellow-500" />
              External security key required
            </span>
          )}
          <Button variant="outline" asChild>
            <Link href={recoverUrl}>Recover access</Link>
          </Button>
        </div>
      )}
    </SecureForm>
  );
}

export function SignUpPage({ children, title = 'Create Account', description = 'Sign up for a new account with your passkey' }: SignUpPageProps): React.JSX.Element {
  const loaderData = useLoaderData<any>();
  const token = isError(loaderData) ? '' : (loaderData?.token ?? '');

  return (
    <SecureProvider token={token}>
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
