import { Body, Container, Head, Html, Section, Text } from '@ycore/componentry/email';
import { defineEmailTemplate } from '../@types/email-template-builder';
import { TEMPLATE_STYLES_MAP } from './tailwind.styles';

export interface MinimalEmailData {
  subject: string;
  message: string;
}

/**
 * Minimal Email Template
 */
export const MinimalEmailTemplate = defineEmailTemplate({
  component: ({ message }: MinimalEmailData) => (
    <Html lang="en">
      <Head />
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-2xl">
          <Section className="p-4">
            <Text className="text-gray-900">{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  ),

  subject: ({ subject }) => subject,

  stylesMap: TEMPLATE_STYLES_MAP,
});
