import path from 'node:path';
import type { EmailTailwindConfig } from '../../email/@types/email-tailwind.types';

/**
 * Auth Templates Tailwind CSS Map Configuration
 */
export const authTemplateConfig: EmailTailwindConfig = {
  inputFilespec: ['workspaces/foundry/src/auth/templates/**/*.tsx'],
  outputFile: 'workspaces/foundry/src/auth/templates/tailwind.styles.ts',
  baseDir: path.resolve(process.cwd(), '../..'),
  cssInput: ['workspaces/componentry/src/shadcn-ui/styles/gray.css', 'workspaces/componentry/src/shadcn-ui/styles/shadcn-ui.css'],
  validate: true,
};

export default authTemplateConfig;
