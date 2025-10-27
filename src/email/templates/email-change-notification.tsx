import { Body, Container, Head, Heading, Html, Section, Tailwind, Text } from '@react-email/components';
import { emailTailwindConfig } from './email-tailwind.config';

export interface EmailChangeNotificationData {
  oldEmail: string;
  newEmail: string;
}

/**
 * Email Change Notification Template Component
 * Sent to the old email address to inform about email change request
 * This is an informational notification, not a verification email
 */
export function EmailChangeNotificationTemplate({ oldEmail, newEmail }: EmailChangeNotificationData) {
  return (
    <Html>
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl text-gray-800 leading-relaxed">
            <Section className="m-5 text-center">
              <Heading as="h1">Important security notification</Heading>
            </Section>

            <Section className="m-5 rounded-lg border-2 border-muted-100 bg-muted-50 p-5 text-center">
              <Text>
                A request was received to change the account access email from <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>, and is pending approval.
              </Text>
              <Text>
                A verification code was sent to <strong>{newEmail}</strong>.
              </Text>
              <Text>The account email will only be changed once the new address is successfully verified.</Text>
            </Section>

            <Section className="m-4 text-center text-muted-400 text-sm">
              <Text>If the email change was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account.</Text>
              <Heading as="h3" className="text-red-500">
                If unauthorized, take immediate action:
              </Heading>
              <Section className="text-left mx-auto max-w-md">
                <Text className="italic">• Sign in to the account at {oldEmail}</Text>
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
