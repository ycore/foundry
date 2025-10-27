import { Body, Container, Head, Html, Tailwind, Text } from '@react-email/components';
import { emailTailwindConfig } from './email-tailwind.config';

export interface MinimalEmailData {
  message: string;
}

/**
 * Minimal Email Template Component
 */
export function MinimalEmailTemplate({ message }: MinimalEmailData) {
  return (
    <Html>
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl">
            <Text className="text-gray-900">{message}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
