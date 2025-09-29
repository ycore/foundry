import { Button, Card, Input, Link, Spinner } from '@ycore/componentry/shadcn-ui';
import svgSpriteUrl from '@ycore/componentry/shadcn-ui/assets/lucide-sprites.svg?url';
import { isError } from '@ycore/forge/result';
import clsx from 'clsx';
import * as React from 'react';
import { useActionData, useLoaderData, useNavigation, useSubmit } from 'react-router';
import { Form, FormError, SecureForm, SecureProvider } from '../../secure';
import { createAuthenticationOptions } from '../services/webauthn-oslo';
import { isWebAuthnSupported, startAuthentication } from './webauthn-client';

interface SignInFormProps {
  signupUrl: string;
}

export function SignInForm({ signupUrl }: SignInFormProps) {
  const navigation = useNavigation();
  const actionData = useActionData<any>();
  const loaderData = useLoaderData<any>();
  const submit = useSubmit();
  const isSubmitting = navigation.state === 'submitting';
  const errors = actionData?.success === false ? actionData.error?.details || {} : {};
  const [webAuthnSupported, setWebAuthnSupported] = React.useState(false);
  const [webAuthnError, setWebAuthnError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setWebAuthnSupported(isWebAuthnSupported());
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
      // Create authentication options
      const options = createAuthenticationOptions(
        window.location.hostname,
        loaderData.challenge,
        [] // Will be populated server-side in the future
      );

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Create new FormData with WebAuthn response
      const submitFormData = new FormData(form);
      submitFormData.append('webauthn_response', JSON.stringify(credential));
      submitFormData.append('intent', 'signin'); // Explicitly add the intent

      // Submit using React Router's submit function
      submit(submitFormData, { method: 'post' });
    } catch (error) {
      setWebAuthnError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  return (
    <SecureForm method="post" onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Form.Field label="Email" error={errors.email}>
        <Input name="email" type="email" placeholder="Enter your email" autoComplete="email webauthn" required autoFocus />
      </Form.Field>

      {(errors.form || webAuthnError) && <FormError error={errors.form || webAuthnError} />}

      <div className="flex justify-between gap-x-2">
        <Button type="submit" name="intent" value="signin" disabled={isSubmitting || !webAuthnSupported} className="flex-1">
          <Spinner spriteUrl={svgSpriteUrl} className={clsx('size-5', !isSubmitting && 'hidden')} />
          {isSubmitting ? 'Signing in...' : !webAuthnSupported ? 'WebAuthn not supported' : 'Sign in with Passkey'}
        </Button>

        <Button type="button" variant="outline" asChild>
          <Link href={signupUrl}>Sign Up</Link>
        </Button>
      </div>
    </SecureForm>
  );
}

interface SignInPageProps {
  loaderData: any;
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

export function SignInPage({ loaderData, children, title = 'Sign In', description = 'Sign in to your account with your passkey' }: SignInPageProps) {
  const secureLoaderData = isError(loaderData) ? { csrfToken: null, errors: loaderData } : loaderData;

  return (
    <SecureProvider loaderData={secureLoaderData}>
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
