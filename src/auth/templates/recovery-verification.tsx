import { Body, Container, Head, Heading, Html, Link, Section, Text } from '@ycore/componentry/email';
import { defineEmailTemplate } from '../../email/@types/email-template-builder';
import { TEMPLATE_STYLES_MAP } from './tailwind.styles';

export interface RecoveryVerificationData {
  code: string;
  email: string;
  verificationUrl?: string;
}

/**
 * Account Recovery Verification Template
 * Sent when user requests account recovery (lost passkey access)
 * Combines security notification + verification code in a single email
 */
export const RecoveryVerificationTemplate = defineEmailTemplate({
  component: ({ code, email, verificationUrl }: RecoveryVerificationData) => (
    <Html lang="en">
      <Head />
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-2xl text-foreground leading-relaxed">
          <Section className="px-5 pt-10 pb-5 text-center">
            <Heading level={1}>Account Recovery Request</Heading>
          </Section>

          <Section className="m-5 rounded-lg border-2 border-border bg-muted p-5 text-center">
            <Text>
              An account recovery request for <strong>{email}</strong> is pending approval.
            </Text>
            <Text>If approved, registration of a new passkey will be allowed to proceed.</Text>
            <Text>Please approve the account recovery request using the code below.</Text>
          </Section>

          <Section className="m-5 rounded-lg border-2 border-border bg-muted p-5 text-center">
            <Text className="m-0 font-bold text-[32px] text-foreground tracking-[8px]">{code}</Text>
          </Section>

          <Section className="m-3 text-center text-muted-foreground text-sm">
            <Text>
              This code will expire within <strong>8 minutes</strong> if not approved.
            </Text>
          </Section>

          {verificationUrl && (
            <Section className="m-4 rounded-2xl bg-muted p-3 text-center">
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

          <Section className="m-4 text-center text-muted-foreground text-sm">
            <Text>If this code was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account.</Text>
            <Heading level={3} className="text-destructive">
              If unauthorized, take immediate action:
            </Heading>
            <Section className="mx-auto max-w-md text-left">
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
    </Html>
  ),

  subject: () => 'Account Recovery Verification',

  stylesMap: TEMPLATE_STYLES_MAP,
});
