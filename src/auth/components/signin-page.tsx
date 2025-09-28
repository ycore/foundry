import { Button, Card, Input, Link, Spinner } from '@ycore/componentry/shadcn-ui';
import svgSpriteUrl from '@ycore/componentry/shadcn-ui/assets/lucide-sprites.svg?url';
import { isError } from '@ycore/forge/result';
import clsx from 'clsx';
import * as React from 'react';
import { SecureFetcher, SecureForm, SecureProvider, useSecureFetcher } from '../../secure';
import type { WebAuthnOptionsResponse } from '../@types/auth.types';
import { handleFormSubmit } from './auth-form-handler';

interface SignInFormProps {
  signupUrl: string;
}

export function SignInForm({ signupUrl }: SignInFormProps) {
  const emailFetcher = useSecureFetcher<{ options: WebAuthnOptionsResponse; email: string; userExists: boolean; ready: boolean }>({ key: 'email-check' });
  const [intent, setIntent] = React.useState<'email' | 'passkey'>('email');
  const [email, setEmail] = React.useState('');
  const [webAuthnOptions, setWebAuthnOptions] = React.useState<WebAuthnOptionsResponse | null>(null);

  // Handle email check response - React Router handles transitions automatically
  React.useEffect(() => {
    if (emailFetcher.data && !isError(emailFetcher.data)) {
      const { options, email: validEmail, ready } = emailFetcher.data;
      if (ready) {
        setEmail(validEmail);
        setWebAuthnOptions(options);
        // Trigger view transition for smooth step change
        if (document.startViewTransition) {
          document.startViewTransition(() => setIntent('passkey'));
        } else {
          setIntent('passkey');
        }
      }
    }
  }, [emailFetcher.data]);

  // Step 1: Verify email
  if (intent === 'email') {
    return (
      <emailFetcher.SecureForm method="post" className="flex flex-col gap-6" style={{ viewTransitionName: 'signin-form' }}>
        <SecureFetcher.Field label="Email" name="email" required error={emailFetcher.errors?.email || emailFetcher.errors?.field}>
          <Input name="email" type="text" placeholder="Enter your email" autoComplete="email webauthn" required autoFocus />
        </SecureFetcher.Field>

        <SecureFetcher.Error error={emailFetcher.errors?.general} />

        <div className="flex justify-between gap-x-2">
          <Button type="submit" name="intent" value="check-email" disabled={emailFetcher.state === 'submitting'} style={{ viewTransitionName: 'signin-button' }} className="flex-1">
            <Spinner spriteUrl={svgSpriteUrl} className={clsx('size-5', emailFetcher.state !== 'submitting' ? 'hidden' : '')} />
            {emailFetcher.state === 'submitting' ? 'Checking...' : 'Sign in'}
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href={signupUrl}>Sign Up</Link>
          </Button>
        </div>
      </emailFetcher.SecureForm>
    );
  }

  // Step 2: Authentication with passkey
  return (
    <SecureForm method="post" onSubmit={webAuthnOptions ? handleFormSubmit(webAuthnOptions) : undefined} className="flex flex-col gap-6" style={{ viewTransitionName: 'signin-form' }}>
      <div className="flex flex-col gap-2">
        <label htmlFor="email">Email</label>
        <Input name="email" type="text" value={email} readOnly className="bg-gray-50" />
      </div>

      <div className="flex justify-between gap-x-2">
        <Button type="submit" name="intent" value="authentication" style={{ viewTransitionName: 'signin-button' }}>
          Authenticate with Passkey
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (document.startViewTransition) {
              document.startViewTransition(() => {
                setIntent('email');
                setEmail('');
                setWebAuthnOptions(null);
              });
            } else {
              setIntent('email');
              setEmail('');
              setWebAuthnOptions(null);
            }
          }}
        >
          Use Different Email
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

export function SignInPage({ loaderData, children, title = "Sign In", description = "Enter your email to sign in with your passkey" }: SignInPageProps) {
  const secureLoaderData = isError(loaderData) ? { csrfToken: null, errors: loaderData } : loaderData;

  return (
    <SecureProvider loaderData={secureLoaderData}>
      <div className="mx-auto min-w-md max-w-lg px-4 py-8">
        <Card>
          <Card.Header>
            <Card.Title>{title}</Card.Title>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>
            {children}
          </Card.Content>
        </Card>
      </div>
    </SecureProvider>
  );
}
