#!/usr/bin/env bun
import { pathToFileURL } from 'node:url';
import type { BaseIssue } from 'valibot';
import { array, boolean, minLength, object, optional, pipe, safeParse, string, union } from 'valibot';
import type { EmailTailwindConfig } from './@types/email-tailwind.types';
import { createTailwindMap } from './create-tailwind-plugin';

const EmailTailwindConfigSchema = object({
  inputFilespec: union([string(), array(string())]),
  outputFile: pipe(string(), minLength(1, 'outputFile cannot be empty')),
  baseDir: optional(string()),
  cssInput: optional(union([string(), array(string())])),
  validate: optional(boolean()),
});

const EmailConfigsSchema = union([EmailTailwindConfigSchema, array(EmailTailwindConfigSchema)]);

function formatValidationErrors(issues: BaseIssue<unknown>[], configIndex?: number): string {
  const prefix = configIndex !== undefined ? `Config at index ${configIndex}` : 'Config';
  const errorList = issues
    .map(issue => {
      const path = issue.path?.map(p => p.key).join('.') || 'unknown';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');

  return `❌ ${prefix} validation failed:\n${errorList}`;
}

async function loadConfig(configPath: string): Promise<EmailTailwindConfig | EmailTailwindConfig[] | null> {
  try {
    // Convert to file URL for dynamic import (works with both absolute and relative paths)
    const fileUrl = pathToFileURL(configPath).href;
    const configModule = await import(fileUrl);

    // Support both default and named exports
    const config = configModule.default || configModule.emailTailwindConfig;

    if (!config) {
      console.error(`❌ No config found in ${configPath}\n   Expected: default export or emailTailwindConfig`);
      return null;
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to load config from ${configPath}:\n   ${error.message}`);
    } else {
      console.error(`❌ Failed to load config from ${configPath}`);
    }
    return null;
  }
}

async function createTailwindMaps(args: EmailTailwindConfig | EmailTailwindConfig[]) {
  const configs = Array.isArray(args) ? args : [args];

  for (const config of configs) {
    await createTailwindMap(config);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const configPaths = args;

  if (configPaths.length === 0) {
    console.error(`❌ Usage: bun create-tailwind-cli.ts <config-path> [<config-path2> ...]

Config file should export EmailTailwindConfig | EmailTailwindConfig[] as:
  - default export (recommended)
  - named export: emailTailwindConfig

`);
    process.exit(1);
  }

  let hasErrors = false;

  // Process each config file
  for (const configPath of configPaths) {
    console.info(`📁 Loading config from: ${configPath}`);

    const config = await loadConfig(configPath);
    if (!config) {
      hasErrors = true;
      continue;
    }

    // Validate config using Valibot schema
    const parseResult = safeParse(EmailConfigsSchema, config, { abortEarly: false });

    if (!parseResult.success) {
      console.error(formatValidationErrors(parseResult.issues));
      hasErrors = true;
      continue;
    }

    await createTailwindMaps(parseResult.output);
  }

  if (hasErrors) {
    console.error('\n❌ Some config files failed to process');
    process.exit(1);
  }

  console.info('✅ Tailwind template styles mapping complete\n');
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
