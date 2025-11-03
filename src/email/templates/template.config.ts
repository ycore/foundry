import path from 'node:path';
import type { EmailTailwindConfig } from '../@types/email-tailwind.types';

/**
 * Email Templates Tailwind CSS Map Configuration
 */
export const emailTemplateConfig: EmailTailwindConfig = {
  inputFilespec: ['workspaces/foundry/src/email/templates/**/*.tsx'],
  outputFile: 'workspaces/foundry/src/email/templates/tailwind.styles.ts',
  baseDir: path.resolve(process.cwd(), '../..'),
  cssInput: ['workspaces/componentry/src/shadcn-ui/styles/gray.css', 'workspaces/componentry/src/shadcn-ui/styles/shadcn-ui.css'],
  validate: true,
};

export default emailTemplateConfig;
