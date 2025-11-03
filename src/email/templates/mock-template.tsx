import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@ycore/componentry/email';
import { defineEmailTemplate } from '../@types/email-template-builder';
import { TEMPLATE_STYLES_MAP } from './tailwind.styles';

export interface MockEmailData {
  subject: string;
  message: string;
  recipientName?: string;
}

/**
 * Mock Email Template
 * Generic template for demonstration and testing purposes
 */
export const MockEmailTemplate = defineEmailTemplate({
  component: ({ subject, message, recipientName = 'there' }: MockEmailData) => (
    <Html lang="en">
      <Head />
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-2xl text-foreground">
          <Section className="border-border border-b px-5 pt-10 pb-5 text-center">
            <Heading level={1}>{subject}</Heading>
          </Section>

          <Section className="px-5 py-8">
            <Text>Hello {recipientName},</Text>

            <Section className="my-5 rounded border-blue-500 border-l-4 bg-muted p-5 text-foreground">
              <Text>{message}</Text>
            </Section>

            <Text>Thank you for testing the Foundry email system!</Text>
          </Section>

          <Hr className="my-5 border-border" />

          <Section className="px-5 py-5 text-center text-muted-foreground text-sm">
            <Text>This is a test email sent from the Foundry system.</Text>
            <Text>If you received this email by mistake, please ignore it.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  ),

  subject: ({ subject }) => subject,

  stylesMap: TEMPLATE_STYLES_MAP,
});
