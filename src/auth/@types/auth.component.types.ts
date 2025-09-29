import type { ReactNode } from 'react';
import type { UserDetails } from './auth.types';

// Profile Page Component Types
export interface ProfileCardProps {
  user: UserDetails | null | undefined;
  signoutUrl: string;
}

export interface ProfilePageProps {
  children: ReactNode;
}

// Sign In Page Component Types
export interface SignInFormProps {
  signupUrl: string;
}

export interface SignInPageProps {
  loaderData: any;
  children?: ReactNode;
  title?: string;
  description?: string;
}

// Sign Up Page Component Types
export interface SignUpFormProps {
  signinUrl: string;
}

export interface SignUpPageProps {
  loaderData: any;
  children?: ReactNode;
  title?: string;
  description?: string;
}

// WebAuthn Client Types
export interface WebAuthnCredentialResponse {
  id: string;
  rawId: string;
  type: string;
  response: {
    attestationObject?: string;
    clientDataJSON: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string;
  };
}