import { Body, Container, Head, Heading, Html, Section, Tailwind, Text } from '@react-email/components';
import { emailTailwindConfig } from './email-tailwind.config';

export type VerificationPurpose = 'signup' | 'passkey-add' | 'passkey-delete' | 'email-change' | 'account-delete' | 'recovery';

export interface TotpTemplateData {
  code: string;
  purpose: VerificationPurpose;
}

/**
 * TOTP content structure for each verification purpose
 */
export interface TotpContent {
  title: string;
  message: string;
  action: string;
}

/**
 * Type-safe repository mapping all verification purposes to their content
 * TypeScript will error if any VerificationPurpose is missing or extra keys exist
 */
export type TotpRepository = Record<VerificationPurpose, TotpContent>;

/**
 * Repository of TOTP email content for each verification purpose
 * Indexed by VerificationPurpose for type-safe lookups
 */
export const totpRepository = {
  signup: {
    title: 'Verify Email Address',
    message: 'Thank you for signing up. Please verify the email address to complete the sign-up.',
    action: 'verify your email',
  },
  'passkey-add': {
    title: 'Confirm Adding Passkey',
    message: 'Please verify adding a new passkey to the user account.',
    action: 'confirm adding the passkey',
  },
  'passkey-delete': {
    title: 'Confirm Removing Passkey',
    message: 'Please verify removing a passkey from the user account.',
    action: 'confirm removing the passkey',
  },
  'email-change': {
    title: 'Verify Email Address Update',
    message: 'Please verify the email address change.',
    action: 'verify email address change',
  },
  'account-delete': {
    title: 'Confirm Account Deletion',
    message: 'Please confirm account delete. This action cannot be undone.',
    action: 'confirm account deletion',
  },
  recovery: {
    title: 'Confirm Account Recovery',
    message: 'An account recovery request is pending. Use this code to regain access to the account.',
    action: 'recover your account',
  },
} as const satisfies TotpRepository;

/**
 * TOTP Email Template Component
 * Email template for TOTP verification codes with purpose-specific content
 */
export function TotpEmailTemplate({ code, purpose }: TotpTemplateData) {
  const content = totpRepository[purpose];
  const isHighRisk = purpose === 'account-delete' || purpose === 'passkey-delete';
  const isAccountDelete = purpose === 'account-delete';

  return (
    <Html>
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-white font-sans">
          <Container className={`mx-auto max-w-2xl text-gray-900 leading-relaxed ${isAccountDelete ? 'rounded-lg border-2 border-warning-200 bg-warning-100 p-5' : ''}`}>
            <Section className="px-5 pt-10 pb-5 text-center">
              <Heading as="h1">{content.title}</Heading>
            </Section>

            <Section className="px-5 pb-5 text-center text-gray-600">
              <Text>{content.message}</Text>
            </Section>

            <Section className="mx-5 my-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center">
              <Text className="m-0 font-bold text-[32px] text-muted-600 tracking-[8px]">{code}</Text>
            </Section>

            <Section className="px-5 py-5 text-center text-muted-400 text-sm">
              <Text>
                This code will expire within <strong>8 minutes</strong> of issuing.
              </Text>
              <Text>
                If this code was not requested,
                {isHighRisk ? ' consider securing your account' : ' it can be safely ignored'}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
