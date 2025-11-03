import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { compile } from 'tailwindcss';
import type { Plugin } from 'vite';
import type { EmailTailwindConfig } from './@types/email-tailwind.types';

export function emailTailwindMap(args: EmailTailwindConfig | EmailTailwindConfig[]) {
  const configs = Array.isArray(args) ? args : [args];

  return configs.map((config, index) => {
    const tailwindMapFactory = async () => createTailwindMap(config);

    return {
      name: `email-tailwind-map${index > 0 ? index.toString() : ''}`,
      async buildStart() {
        await tailwindMapFactory();
      },
      async configureServer(server) {
        // Watch template files for changes in dev mode
        const patterns = Array.isArray(config.inputFilespec) ? config.inputFilespec : [config.inputFilespec];

        // Trigger rebuild when templates change
        server.watcher.on('change', async file => {
          const shouldRebuild = patterns.some(pattern => {
            // Simple pattern matching - convert glob to regex
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(file);
          });

          if (shouldRebuild) {
            console.log(`\nEmail template changed: ${path.basename(file)}`);
            await tailwindMapFactory();
            server.ws.send({ type: 'full-reload' });
          }
        });
      },
    } satisfies Plugin;
  });
}

export const createTailwindMap = async (config: EmailTailwindConfig) => {
  const { inputFilespec, outputFile, baseDir = process.cwd(), cssInput, validate = false } = config;

  const patterns = Array.isArray(inputFilespec) ? inputFilespec : [inputFilespec];

  // Step 1: Find all template files
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = glob.sync(pattern, { cwd: baseDir });
    files.push(...matches.map(f => path.join(baseDir, f)));
  }

  if (files.length === 0) {
    console.warn(`⚠️  No template files found matching patterns: ${patterns.join(', ')}`);
    return;
  }

  // Step 2: Extract className values
  const classNames = await extractClassNames(files);

  // Step 3: Compile Tailwind CSS using JIT
  const css = await compileTailwindCSS(Array.from(classNames), baseDir, cssInput);

  // Step 4: Parse CSS to TypeScript
  const { staticMap, dynamicPatterns } = parseCSSToTypeScript(css, classNames);

  console.info(` - Found ${files.length} template files; Extracted ${classNames.size} unique classes, ${Object.keys(staticMap).length} static style maps, ${dynamicPatterns.length} dynamic patterns`);

  // Step 5: Show warnings for unmapped classes
  const mappedClasses = new Set(Object.keys(staticMap));
  const missingClasses: string[] = [];
  for (const cls of classNames) {
    if (!mappedClasses.has(cls) && !cls.includes('[')) {
      missingClasses.push(cls);
    }
  }
  if (missingClasses.length > 0) {
    console.warn(`⚠️  ${missingClasses.length} classes not mapped (likely custom theme classes):`, missingClasses.join(', '));
  }

  // Step 6: Generate TypeScript file
  const stats = {
    templateFiles: files.length,
    uniqueClasses: classNames.size,
    generatedStyles: Object.keys(staticMap).length,
    dynamicPatterns: dynamicPatterns.length,
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.isAbsolute(outputFile) ? outputFile : path.join(baseDir, outputFile);

  const fileContent = generateTypeScriptFile(staticMap, dynamicPatterns, stats);
  await writeChangedFile(outputPath, fileContent);

  // Step 7: Validate if requested
  if (validate) {
    const validationResult = await validateTailwindMap(classNames, staticMap, dynamicPatterns);
    if (!validationResult.valid && validationResult.missingClasses.length > 0) {
      console.warn(`⚠️  Validation warnings: Missing classes: ${validationResult.missingClasses.join(', ')}`);
    }
  }
};

/**
 * Extract className values from template files
 */
async function extractClassNames(files: string[]): Promise<Set<string>> {
  const classNames = new Set<string>();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Match className="..." and className={`...`} and className={'...'}
    const patterns = [/className="([^"]+)"/g, /className='([^']+)'/g, /className={`([^`]+)`}/g, /className={'([^']+)'}/g];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const classString = match[1];

        // Handle template literals with simple variables (remove ${...})
        const cleanedString = classString.replace(/\$\{[^}]+\}/g, '').trim();

        // Split by whitespace and add individual classes
        const classes = cleanedString.split(/\s+/).filter(Boolean);
        for (const cls of classes) {
          classNames.add(cls);
        }
      }
    }
  }

  return classNames;
}

/**
 * Compile Tailwind CSS for given class candidates using JIT compilation
 * Loads custom CSS files to provide theme definitions - Tailwind resolves CSS variables
 */
async function compileTailwindCSS(candidates: string[], baseDir: string, cssInput?: string | string[]): Promise<string> {
  let input: string;

  if (cssInput) {
    const cssFiles = Array.isArray(cssInput) ? cssInput : [cssInput];
    const loadedCSS: string[] = [];

    // Load all CSS files and merge them
    for (const cssFile of cssFiles) {
      const cssPath = path.isAbsolute(cssFile) ? cssFile : path.join(baseDir, cssFile);
      try {
        const content = await fs.readFile(cssPath, 'utf-8');
        loadedCSS.push(content);
      } catch {
        console.warn(`  ⚠️  Could not load CSS from ${cssFile}`);
      }
    }

    if (loadedCSS.length > 0) {
      // Merge all CSS files with Tailwind imports
      // Tailwind v4 JIT will resolve CSS variables and generate utilities
      input = `
        @import "tailwindcss/theme" layer(theme);
        @import "tailwindcss/utilities" layer(utilities);

        ${loadedCSS.join('\n\n')}
      `;
    } else {
      console.warn('  ⚠️  No CSS files loaded, using Tailwind defaults only');
      input = buildDefaultTailwindInput();
    }
  } else {
    // Use Tailwind's built-in defaults (no custom theme)
    console.info('  ℹ️  No cssInput provided, using Tailwind built-in defaults');
    input = buildDefaultTailwindInput();
  }

  // Compile with candidates
  const compiler = await compile(input, {
    async loadStylesheet(id: string, base: string) {
      // Load from node_modules
      if (id === 'tailwindcss' || id.startsWith('tailwindcss/')) {
        try {
          const fileName = id === 'tailwindcss' ? 'index.css' : `${id.split('/')[1]}.css`;
          const tailwindPath = path.join(baseDir, `node_modules/tailwindcss/${fileName}`);
          const content = await fs.readFile(tailwindPath, 'utf-8');
          return { path: tailwindPath, base: path.dirname(tailwindPath), content };
        } catch {
          console.warn(`  ⚠️  Could not load ${id} from node_modules`);
          return { path: '', base: '', content: '' };
        }
      }

      // Load relative imports (e.g., ../workspaces/componentry/src/shadcn-ui/styles/gray.css)
      try {
        const filePath = path.isAbsolute(id) ? id : path.join(base, id);
        const content = await fs.readFile(filePath, 'utf-8');
        return { path: filePath, base: path.dirname(filePath), content };
      } catch {
        console.warn(`  ⚠️  Could not load stylesheet: ${id}`);
        return { path: '', base: '', content: '' };
      }
    },
  });

  return compiler.build(candidates);
}

/**
 * Build minimal Tailwind input CSS
 * Relies on Tailwind's built-in defaults - custom themes should be loaded via cssInput
 */
function buildDefaultTailwindInput(): string {
  return `
    @import "tailwindcss/theme" layer(theme);
    @import "tailwindcss/utilities" layer(utilities);
  `;
}

/**
 * Parse CSS to TypeScript styles maps
 */
function parseCSSToTypeScript(css: string, originalClasses: Set<string>): { staticMap: Record<string, Record<string, string>>; dynamicPatterns: Array<{ regex: string; converter: string }> } {
  const staticMap: Record<string, Record<string, string>> = {};
  const dynamicPatterns: Array<{ regex: string; converter: string }> = [];

  // Extract CSS variables
  const cssVars = extractCSSVariables(css);

  // Parse CSS rules
  const ruleRegex = /\.([.\w-[\]]+)\s*\{([^}]+)\}/g;
  let match = ruleRegex.exec(css);

  while (match !== null) {
    let className = match[1];
    const declarations = match[2];

    // Unescape CSS class selector (e.g., \.max-w-\[672px\] -> max-w-[672px])
    className = className.replace(/\\/g, '');

    // Parse declarations
    const styles: Record<string, string> = {};
    const declRegex = /([\w-]+)\s*:\s*([^;]+);?/g;
    let declMatch = declRegex.exec(declarations);

    while (declMatch !== null) {
      const [, property, value] = declMatch;

      // Advance regex before any continue statements
      declMatch = declRegex.exec(declarations);

      // Skip internal Tailwind properties
      if (property.startsWith('-')) continue;

      // Resolve CSS variables
      const resolvedValue = resolveCSSVariables(value.trim(), cssVars);

      // Convert kebab-case to camelCase
      const camelProp = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      styles[camelProp] = resolvedValue;
    }

    staticMap[className] = styles;
    match = ruleRegex.exec(css);
  }

  // Identify dynamic patterns
  for (const className of originalClasses) {
    if (className.includes('[') && className.includes(']')) {
      const pattern = generateDynamicPattern(className);
      if (pattern && !dynamicPatterns.some(p => p.regex === pattern.regex)) {
        dynamicPatterns.push(pattern);
      }
    }
  }

  return { staticMap, dynamicPatterns };
}

/**
 * Extract CSS variables from :root and @property declarations
 */
function extractCSSVariables(css: string): Map<string, string> {
  const cssVars = new Map<string, string>();

  // Extract from :root and :host blocks (custom theme variables)
  const rootRegex = /(:root|:host)[^{]*\{([^}]+)\}/gs;
  let rootMatch = rootRegex.exec(css);

  while (rootMatch !== null) {
    const declarations = rootMatch[2];
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let varMatch = varRegex.exec(declarations);

    while (varMatch !== null) {
      const [, varName, varValue] = varMatch;
      cssVars.set(`--${varName}`, varValue.trim());
      varMatch = varRegex.exec(declarations);
    }

    rootMatch = rootRegex.exec(css);
  }

  // Extract from @property rules (Tailwind v4 internal variables)
  const propertyRegex = /@property\s+(--[\w-]+)\s*\{([^}]+)\}/gs;
  let propertyMatch = propertyRegex.exec(css);

  while (propertyMatch !== null) {
    const [, varName, declarations] = propertyMatch;
    const initialValueMatch = /initial-value\s*:\s*([^;]+);/i.exec(declarations);

    if (initialValueMatch) {
      // Remove quotes if present and trim whitespace
      const initialValue = initialValueMatch[1].trim().replace(/^["']|["']$/g, '');
      cssVars.set(varName, initialValue);
    }

    propertyMatch = propertyRegex.exec(css);
  }

  return cssVars;
}

/**
 * Resolve CSS var() functions to static values
 */
function resolveCSSVariables(value: string, cssVars: Map<string, string>): string {
  const varRegex = /var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g;

  let resolved = value.replace(varRegex, (match, varName, fallback) => {
    const varValue = cssVars.get(varName);
    if (varValue) return resolveCSSVariables(varValue, cssVars);
    if (fallback) return resolveCSSVariables(fallback.trim(), cssVars);
    return match;
  });

  // Resolve calc() with spacing
  resolved = resolved.replace(/calc\(var\((--[\w-]+)\)\s*\*\s*(\d+)\)/g, (match, varName, multiplier) => {
    const varValue = cssVars.get(varName);
    if (varValue === '0.25rem') {
      return `${Number.parseFloat(multiplier) * 4}px`;
    }
    return match;
  });

  // Resolve calc() with explicit values
  resolved = resolved.replace(/calc\(([\d.]+)(rem|px|em)\s*\*\s*(\d+)\)/g, (_match, value, unit, multiplier) => {
    return `${Number.parseFloat(value) * Number.parseFloat(multiplier)}${unit}`;
  });

  return resolved;
}

/**
 * Generate dynamic pattern for arbitrary values
 */
function generateDynamicPattern(className: string): { regex: string; converter: string } | null {
  if (className.startsWith('text-[') && className.endsWith(']')) {
    return {
      regex: '^text-\\[(.+?)\\]$',
      converter: '(matches: RegExpMatchArray) => ({ fontSize: matches[1] })',
    };
  }

  if (className.startsWith('tracking-[') && className.endsWith(']')) {
    return {
      regex: '^tracking-\\[(.+?)\\]$',
      converter: '(matches: RegExpMatchArray) => ({ letterSpacing: matches[1] })',
    };
  }

  if (className.startsWith('max-w-[') && className.endsWith('px]')) {
    return {
      regex: '^max-w-\\[(\\d+)px\\]$',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Generating code string with template literal
      converter: '(matches: RegExpMatchArray) => ({ maxWidth: `\\${matches[1]}px` })',
    };
  }

  const dimensionMatch = className.match(/^(w|h|min-w|min-h|max-h)-\[(\d+)px\]$/);
  if (dimensionMatch) {
    const prop = dimensionMatch[1];
    const cssProperty = prop === 'w' ? 'width' : prop === 'h' ? 'height' : prop === 'min-w' ? 'minWidth' : prop === 'min-h' ? 'minHeight' : 'maxHeight';

    return {
      regex: `^${prop}-\\[(\\d+)px\\]$`,
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Generating code string with template literal
      converter: `(matches: RegExpMatchArray) => ({ ${cssProperty}: \`\${matches[1]}px\` })`,
    };
  }

  // Match calc() expressions like h-[calc(100vh-350px)] or max-h-[calc(100vh-350px)]
  const calcMatch = className.match(/^(w|h|min-w|min-h|max-w|max-h)-\[calc\((.+?)\)\]$/);
  if (calcMatch) {
    const prop = calcMatch[1];
    const cssProperty = prop === 'w' ? 'width' : prop === 'h' ? 'height' : prop === 'min-w' ? 'minWidth' : prop === 'min-h' ? 'minHeight' : prop === 'max-w' ? 'maxWidth' : 'maxHeight';

    return {
      regex: `^${prop.replace(/-/g, '\\-')}-\\[calc\\((.+?)\\)\\]$`,
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Generating code string with template literal
      converter: `(matches: RegExpMatchArray) => ({ ${cssProperty}: \`calc(\${matches[1]})\` })`,
    };
  }

  return null;
}

/**
 * Statistics about the generated styles maps
 */
interface GenerationStats {
  templateFiles: number;
  uniqueClasses: number;
  generatedStyles: number;
  dynamicPatterns: number;
  timestamp: string;
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(staticMap: Record<string, Record<string, string>>, dynamicPatterns: Array<{ regex: string; converter: string }>, stats: GenerationStats): string {
  const mapEntries = Object.entries(staticMap)
    .map(([className, styles]) => {
      const stylesStr = JSON.stringify(styles);
      return `  '${className}': ${stylesStr},`;
    })
    .join('\n');

  const patternsCode =
    dynamicPatterns.length > 0
      ? dynamicPatterns
          .map(pattern => {
            return `  {\n    regex: /${pattern.regex}/,\n    converter: ${pattern.converter},\n  },`;
          })
          .join('\n')
      : '  // No dynamic patterns detected';

  return `/**
 * ⚠️  DO NOT EDIT THIS FILE MANUALLY
 * Auto-generated Tailwind CSS utility styles map for email components at: ${stats.timestamp}
 *
 *   - Template files scanned: ${stats.templateFiles}
 *   - Unique classes found: ${stats.uniqueClasses}
 *   - Static styles mapped: ${stats.generatedStyles}
 *   - Dynamic patterns: ${stats.dynamicPatterns}
 */

import type { TailwindStylesMap } from '@ycore/componentry/email/server';
import type { CSSProperties } from 'react';

export const TAILWIND_TO_CSS_MAP: Record<string, Partial<CSSProperties>> = {
${mapEntries}
};

export const DYNAMIC_UTILITY_PATTERNS = [
${patternsCode}
];

export const TEMPLATE_STYLES_MAP: TailwindStylesMap = {
  cssMap: TAILWIND_TO_CSS_MAP,
  dynamicPatterns: DYNAMIC_UTILITY_PATTERNS,
};
`;
}

/**
 * Validate generated map against template usage
 */
async function validateTailwindMap(
  templateClasses: Set<string>,
  staticMap: Record<string, Record<string, string>>,
  dynamicPatterns: Array<{ regex: string; converter: string }>
): Promise<{ valid: boolean; missingClasses: string[]; obsoleteClasses: string[] }> {
  const mappedClasses = new Set(Object.keys(staticMap));
  const missingClasses: string[] = [];
  const obsoleteClasses: string[] = [];

  // Check for missing classes
  for (const cls of templateClasses) {
    if (!mappedClasses.has(cls)) {
      // Check if it matches a dynamic pattern
      const matchesDynamic = dynamicPatterns.some(pattern => new RegExp(pattern.regex).test(cls));
      if (!matchesDynamic) {
        missingClasses.push(cls);
      }
    }
  }

  // Check for obsolete classes
  for (const cls of mappedClasses) {
    if (!templateClasses.has(cls)) {
      obsoleteClasses.push(cls);
    }
  }

  return {
    valid: missingClasses.length === 0 && obsoleteClasses.length === 0,
    missingClasses: missingClasses.sort(),
    obsoleteClasses: obsoleteClasses.sort(),
  };
}

/**
 * Write file only if content has changed (matches spritesheet pattern)
 */
async function writeChangedFile(filepath: string, newContent: string) {
  try {
    const dirPath = path.dirname(filepath);
    await fs.mkdir(dirPath, { recursive: true });

    const existingContent = await fs.readFile(filepath, 'utf8');
    if (existingContent !== newContent) {
      await fs.writeFile(filepath, newContent, 'utf8');
      console.log(` - Updated: ${filepath}`);
    } else {
      console.log(` - No changes: ${filepath}`);
    }
  } catch (_e) {
    await fs.writeFile(filepath, newContent, 'utf8');
    console.log(` - Created: ${filepath}`);
  }
}
