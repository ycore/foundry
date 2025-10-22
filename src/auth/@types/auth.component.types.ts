import type { ReactNode } from 'react';
import type { Authenticator, User } from '../schema';
import type { PendingEmailChange } from '../server/email-change-service';

// Profile Page Component Types
export interface ProfileCardProps {
  user: User | null | undefined;
  signoutUrl: string;
  verifyUrl: string;
  pendingEmailChange?: PendingEmailChange | null;
}

export interface AuthenticatorsCardProps {
  authenticators: Authenticator[];
}

export interface ProfilePageProps {
  children: ReactNode;
}

// Sign In Page Component Types
export interface SignInFormProps {
  recoverUrl: string;
  signupUrl: string;
}

export interface SignInPageProps {
  children?: ReactNode;
  title?: string;
  description?: string;
}

// Sign Up Page Component Types
export interface SignUpFormProps {
  recoverUrl: string;
  signinUrl: string;
}

export interface SignUpPageProps {
  children?: ReactNode;
  title?: string;
  description?: string;
}

// Account Recovery Component Types
export interface RecoverFormProps {
  signinUrl: string;
}

export interface RecoverPageProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

// WebAuthn Client Types
export interface WebAuthnCredentialResponse {
  id: string;
  rawId: string;
  type: string;
  authenticatorAttachment?: AuthenticatorAttachment | null;
  response: {
    attestationObject?: string;
    clientDataJSON: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string;
    transports?: AuthenticatorTransport[];
  };
}
