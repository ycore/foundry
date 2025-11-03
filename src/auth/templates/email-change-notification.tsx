import { Body, Container, Head, Heading, Html, Section, Text } from '@ycore/componentry/email';
import { defineEmailTemplate } from '../../email/@types/email-template-builder';
import { TEMPLATE_STYLES_MAP } from './tailwind.styles';

export interface EmailChangeNotificationData {
  oldEmail: string;
  newEmail: string;
}

/**
 * Email Change Notification Template
 * Sent to the old email address to inform about email change request
 * This is an informational notification, not a verification email
 */
export const EmailChangeNotificationTemplate = defineEmailTemplate({
  component: ({ oldEmail, newEmail }: EmailChangeNotificationData) => (
    <Html lang="en">
      <Head />
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-2xl text-foreground leading-relaxed">
          <Section className="m-5 text-center">
            <Heading level={1}>Important security notification</Heading>
          </Section>

          <Section className="m-5 rounded-lg border-2 border-border bg-muted p-5 text-center">
            <Text>
              A request was received to change the account access email from <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>, and is pending approval.
            </Text>
            <Text>
              A verification code was sent to <strong>{newEmail}</strong>.
            </Text>
            <Text>The account email will only be changed once the new address is successfully verified.</Text>
          </Section>

          <Section className="m-4 text-center text-muted-foreground text-sm">
            <Text>If the email change was not requested, consider that someone may have unauthorized access to the account. It may be necessary to secure the account.</Text>
            <Heading level={3} className="text-destructive">
              If unauthorized, take immediate action:
            </Heading>
            <Section className="mx-auto max-w-md text-left">
              <Text className="italic">• Sign in to the account at {oldEmail}</Text>
              <Text className="italic">• Review the security settings and passkeys</Text>
              <Text className="italic">• Remove any unfamiliar devices</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  ),

  subject: () => 'Important Security Notification - Email Change Request',

  stylesMap: TEMPLATE_STYLES_MAP,
});
