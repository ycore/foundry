import { Button, Input } from '@ycore/componentry/shadcn-ui';
import { SecureForm } from '@ycore/foundry/secure';
import type { WebAuthnOptionsResponse } from '../@types/auth.types';
import { handleFormSubmit } from './auth-form-handler';

interface AuthFormProps {
  options: WebAuthnOptionsResponse;
  errors?: Record<string, string> | null;
  mode?: 'signup' | 'signin' | 'combined';
}

export function AuthForm({ options, errors, mode = 'combined' }: AuthFormProps) {
  const showRegistration = mode === 'signup' || mode === 'combined';
  const showAuthentication = mode === 'signin' || mode === 'combined';

  return (
    <SecureForm method="post" onSubmit={handleFormSubmit(options)} className="flex flex-col gap-4" errors={errors}>
      {showRegistration && (
        <>
          <SecureForm.Field className="flex flex-col gap-2" label="Username *" name="username">
            <Input id="username" name="username" type="text" placeholder="Enter your username" autoComplete="username webauthn" required />
          </SecureForm.Field>

          <SecureForm.Field className="flex flex-col gap-2" label="Display Name *" name="displayName">
            <Input id="displayName" name="displayName" type="text" placeholder="Enter your display name" autoComplete="name" required />
          </SecureForm.Field>

          <Button type="submit" name="intent" value="check-username" variant="outline" className="w-full">
            Check Username Availability
          </Button>

          <Button type="submit" name="intent" value="registration" disabled={options.usernameAvailable !== true} className="w-full">
            Register with Passkey
          </Button>
        </>
      )}

      {showAuthentication && showRegistration && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
      )}

      {showAuthentication && (
        <>
          {mode === 'signin' && (
            <SecureForm.Field className="flex flex-col gap-2" label="Username *" name="username">
              <Input id="username" name="username" type="text" placeholder="Enter your username" autoComplete="username webauthn" required />
            </SecureForm.Field>
          )}

          <Button type="submit" name="intent" value="authentication" variant={showRegistration ? 'secondary' : 'default'} className="w-full">
            Sign In with Passkey
          </Button>
        </>
      )}
    </SecureForm>
  );
}

export function SimpleAuthForm({ options, errors }: AuthFormProps) {
  return (
    <SecureForm method="post" onSubmit={handleFormSubmit(options)} className="flex flex-col gap-4" errors={errors}>
      <SecureForm.Field className="flex flex-col gap-2" label="Username" name="username">
        <Input id="username" name="username" type="text" placeholder="Enter your username" autoComplete="username webauthn" />
      </SecureForm.Field>

      <Button type="submit" name="intent" value="check-username" variant="outline" className="w-full">
        Check Username
      </Button>

      <Button type="submit" name="intent" value="registration" disabled={options.usernameAvailable !== true} className="w-full">
        Register
      </Button>

      <Button type="submit" name="intent" value="authentication" variant="secondary" className="w-full">
        Authenticate
      </Button>
    </SecureForm>
  );
}
