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
  const usernameFetcher = useSecureFetcher<{ options: WebAuthnOptionsResponse; username: string; userExists: boolean; ready: boolean }>({ key: 'username-check' });
  const [intent, setIntent] = React.useState<'username' | 'passkey'>('username');
  const [username, setUsername] = React.useState('');
  const [webAuthnOptions, setWebAuthnOptions] = React.useState<WebAuthnOptionsResponse | null>(null);

  // Handle username check response - React Router handles transitions automatically
  React.useEffect(() => {
    if (usernameFetcher.data && !isError(usernameFetcher.data)) {
      const { options, username: validUsername, ready } = usernameFetcher.data;
      if (ready) {
        setUsername(validUsername);
        setWebAuthnOptions(options);
        // Trigger view transition for smooth step change
        if (document.startViewTransition) {
          document.startViewTransition(() => setIntent('passkey'));
        } else {
          setIntent('passkey');
        }
      }
    }
  }, [usernameFetcher.data]);

  // Step 1: Verify username
  if (intent === 'username') {
    return (
      <usernameFetcher.SecureForm method="post" className="flex flex-col gap-6" style={{ viewTransitionName: 'signin-form' }}>
        <SecureFetcher.Field label="Username" name="username" required error={usernameFetcher.errors?.username || usernameFetcher.errors?.field}>
          <Input name="username" type="text" placeholder="Enter your username" autoComplete="username webauthn" required autoFocus />
        </SecureFetcher.Field>

        <SecureFetcher.Error error={usernameFetcher.errors?.general} />

        <div className="flex justify-between gap-x-2">
          <Button type="submit" name="intent" value="check-username" disabled={usernameFetcher.state === 'submitting'} style={{ viewTransitionName: 'signin-button' }} className="flex-1">
            <Spinner spriteUrl={svgSpriteUrl} className={clsx('size-5', usernameFetcher.state !== 'submitting' ? 'hidden' : '')} />
            {usernameFetcher.state === 'submitting' ? 'Checking...' : 'Sign in'}
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href={signupUrl}>Sign Up</Link>
          </Button>
        </div>
      </usernameFetcher.SecureForm>
    );
  }

  // Step 2: Authentication with passkey
  return (
    <SecureForm method="post" onSubmit={webAuthnOptions ? handleFormSubmit(webAuthnOptions) : undefined} className="flex flex-col gap-6" style={{ viewTransitionName: 'signin-form' }}>
      <div className="flex flex-col gap-2">
        <label htmlFor="username">Username</label>
        <Input name="username" type="text" value={username} readOnly className="bg-gray-50" />
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
                setIntent('username');
                setUsername('');
                setWebAuthnOptions(null);
              });
            } else {
              setIntent('username');
              setUsername('');
              setWebAuthnOptions(null);
            }
          }}
        >
          Use Different Username
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

export function SignInPage({ loaderData, children, title = "Sign In", description = "Enter your username to sign in with your passkey" }: SignInPageProps) {
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