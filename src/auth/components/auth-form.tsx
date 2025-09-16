import { Button, Input, Label } from '@ycore/componentry/shadcn-ui';
import { Form } from 'react-router';
import type { WebAuthnOptionsResponse } from '../@types/auth.types';
import { handleFormSubmit } from './auth-form-handler';

interface AuthFormProps {
  options: WebAuthnOptionsResponse;
  errors?: any;
  mode?: 'signup' | 'signin' | 'combined';
}

export function AuthForm({ options, errors, mode = 'combined' }: AuthFormProps) {
  const showRegistration = mode === 'signup' || mode === 'combined';
  const showAuthentication = mode === 'signin' || mode === 'combined';

  return (
    <Form method="post" onSubmit={handleFormSubmit(options)} className="flex flex-col gap-4">
      {showRegistration && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username *</Label>
            <Input 
              id="username" 
              name="username" 
              type="text" 
              placeholder="Enter your username" 
              autoComplete="username webauthn"
              required
            />
            {errors?.username && <span className="text-sm text-red-500">{errors.username}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input 
              id="displayName" 
              name="displayName" 
              type="text" 
              placeholder="Enter your display name" 
              autoComplete="name"
              required
            />
            {errors?.displayName && <span className="text-sm text-red-500">{errors.displayName}</span>}
          </div>

          <Button type="submit" formMethod="GET" variant="outline" className="w-full">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username *</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="Enter your username" 
                autoComplete="username webauthn"
                required
              />
              {errors?.username && <span className="text-sm text-red-500">{errors.username}</span>}
            </div>
          )}
          
          <Button type="submit" name="intent" value="authentication" variant={showRegistration ? 'secondary' : 'default'} className="w-full">
            Sign In with Passkey
          </Button>
        </>
      )}

      {errors?.general && <span className="text-sm text-red-500">{errors.general}</span>}
    </Form>
  );
}

export function SimpleAuthForm({ options, errors }: AuthFormProps) {
  return (
    <Form method="post" onSubmit={handleFormSubmit(options)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" type="text" placeholder="Enter your username" autoComplete="username webauthn" />
        {errors?.username && <span className="text-sm text-red-500">{errors.username}</span>}
      </div>

      <Button type="submit" formMethod="GET" variant="outline" className="w-full">
        Check Username
      </Button>

      <Button type="submit" name="intent" value="registration" disabled={options.usernameAvailable !== true} className="w-full">
        Register
      </Button>

      <Button type="submit" name="intent" value="authentication" variant="secondary" className="w-full">
        Authenticate
      </Button>

      {errors?.general && <span className="text-sm text-red-500">{errors.general}</span>}
    </Form>
  );
}
