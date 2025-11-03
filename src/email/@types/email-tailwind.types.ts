/**
 * Configuration for email Tailwind CSS map generation
 *
 * This defines the structure for generating static Tailwind CSS styles map
 * that can be used to inline styles in email templates where CSS classes
 * are not supported by email clients.
 */

import type { CSSProperties } from 'react';

/**
 * Configuration for a single email Tailwind map generation
 */
export interface EmailTailwindConfig {
  /**
   * Glob patterns to match email template files
   * @example ['templates/**\/*.tsx', 'components/**\/*.tsx']
   */
  inputFilespec: string | string[];

  /**
   * Output file path for generated Tailwind map
   * @example 'src/email/server/tailwind-to-inline.generated.ts'
   */
  outputFile: string;

  /**
   * Base directory for resolving relative paths (optional)
   * Defaults to process.cwd()
   */
  baseDir?: string;

  /**
   * Path(s) to custom CSS file(s) with theme definitions (optional)
   * Use this to load your existing Tailwind CSS files with CSS variables and theme definitions
   * Tailwind v4's JIT compiler will resolve CSS variables and generate proper inline styles
   *
   * If not specified, uses Tailwind's built-in default theme
   * Can be a single file or an array of files loaded in order
   *
   * @example 'app/styles/tailwind.css'
   * @example ['workspaces/componentry/src/shadcn-ui/styles/gray.css', 'workspaces/componentry/src/shadcn-ui/styles/shadcn-ui.css']
   */
  cssInput?: string | string[];

  /**
   * Whether to validate the generated map against template usage (optional)
   * Defaults to false
   */
  validate?: boolean;
}

/**
 * Statistics from the generation process
 */
export interface GenerationStats {
  templateFiles: number;
  uniqueClasses: number;
  generatedStyles: number;
  dynamicPatterns: number;
  timestamp: string;
}

/**
 * Dynamic utility pattern for arbitrary values
 */
export interface DynamicPattern {
  regex: string;
  converter: string;
}

/**
 * Result of parsing CSS to TypeScript
 */
export interface ParsedCSS {
  staticMap: Record<string, CSSProperties>;
  dynamicPatterns: DynamicPattern[];
}

/**
 * Validation result comparing templates to generated map
 */
export interface ValidationResult {
  valid: boolean;
  missingClasses: string[];
  obsoleteClasses: string[];
  totalTemplateClasses: number;
  totalMappedClasses: number;
}
