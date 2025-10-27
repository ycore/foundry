import { Body, Container, Head, Heading, Hr, Html, Section, Tailwind, Text } from '@react-email/components';
import { emailTailwindConfig } from './email-tailwind.config';

export interface MockEmailData {
  subject: string;
  message: string;
  recipientName?: string;
}

/**
 * Mock Email Template Component
 * Generic template for demonstration and testing purposes
 */
export function MockEmailTemplate({ subject, message, recipientName = 'there' }: MockEmailData) {
  return (
    <Html>
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl text-gray-900">
            <Section className="border-muted-100 border-b px-5 pt-10 pb-5 text-center">
              <Heading as="h1">{subject}</Heading>
            </Section>

            <Section className="px-5 py-8">
              <Text>Hello {recipientName},</Text>

              <Section className="my-5 rounded border-blue-500 border-l-4 bg-muted-50 p-5 text-muted-600">
                <Text>{message}</Text>
              </Section>

              <Text>Thank you for testing the Foundry email system!</Text>
            </Section>

            <Hr className="my-5 border-muted-100" />

            <Section className="px-5 py-5 text-center text-muted-400 text-sm">
              <Text>This is a test email sent from the Foundry system.</Text>
              <Text>If you received this email by mistake, please ignore it.</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
