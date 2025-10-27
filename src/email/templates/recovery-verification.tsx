import { Body, Container, Head, Heading, Html, Link, Section, Tailwind, Text } from '@react-email/components';
import { emailTailwindConfig } from './email-tailwind.config';

export interface RecoveryVerificationData {
  code: string;
  email: string;
  verificationUrl?: string;
}

/**
 * Account Recovery Verification Template Component
 * Sent when user requests account recovery (lost passkey access)
 * Combines security notification + verification code in a single email
 */
export function RecoveryVerificationTemplate({ code, email, verificationUrl }: RecoveryVerificationData) {
  return (
    <Html>
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl text-gray-900 leading-relaxed">
            <Section className="px-5 pt-10 pb-5 text-center">
              <Heading as="h1">Account Recovery Request</Heading>
            </Section>

            <Section className="m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center">
              <Text>
                An account recovery request for <strong>{email}</strong> is pending approval.{' '}
              </Text>
              <Text>If approved, registration of a new passkey will be allowed to proceed.</Text>
              <Text>Please approve the account recovery request using the code below.</Text>
            </Section>

            <Section className="m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center">
              <Text className="m-0 font-bold text-[32px] text-muted-600 tracking-[8px]">{code}</Text>
            </Section>

            <Section className="m-3 text-center text-muted-400 text-sm">
              <Text>
                {' '}
                This code will expire within <strong>8 minutes</strong> if not approved.
              </Text>
            </Section>

            {verificationUrl && (
              <Section className="m-4 rounded-2xl bg-muted-100 p-3 text-center">
                <Text className="mx-2">
                  <Link href={verificationUrl} className="font-bold no-underline">
                    Click this link to approve the change
                  </Link>
                </Text>

                <Text className="mx-2">
                  <Text>If having trouble using the link above, use the url below to verify.</Text>
                  <Link href={verificationUrl} className="underline">
                    {verificationUrl}
                  </Link>
                </Text>
              </Section>
            )}

            <Section className="m-4 text-center text-muted-400 text-sm">
              <Text>If this code was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account.</Text>
              <Heading as="h3" className="text-red-500">
                If unauthorized, take immediate action:
              </Heading>
              <Section className="text-left mx-auto max-w-md">
                <Text className="italic">
                  • <strong>Do not enter the verification code.</strong>
                </Text>
                <Text className="italic">• Sign in to the account at {email}</Text>
                <Text className="italic">• Review the security settings and passkeys</Text>
                <Text className="italic">• Remove any unfamiliar devices</Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
