/**
 * Tailwind CSS Configuration for Email Templates
 * Aligned with Tailwind v4 design system used in the main application
 */
export const emailTailwindConfig = {
  theme: {
    extend: {
      colors: {
        // ─────────────────────────────────────────────────────────────────────
        // Tailwind Default Gray Scale (Aligned with App)
        // ─────────────────────────────────────────────────────────────────────
        // Used in templates: text-gray-900, text-gray-600, text-gray-800
        // Maps to app's --color-gray-* custom properties
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db', // App --muted in light mode
          400: '#9ca3af',
          500: '#6b7280', // App --muted-foreground in light mode
          600: '#4b5563',
          700: '#374151', // App --primary in light mode
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },

        // ─────────────────────────────────────────────────────────────────────
        // Muted Scale (Enhanced - Backward Compatible)
        // ─────────────────────────────────────────────────────────────────────
        // Heavily used in email templates for subtle backgrounds and text
        // Now includes full scale for flexibility, aligned with gray scale
        muted: {
          50: '#f9fafb', // Very light background
          100: '#f3f4f6', // Light background (used in templates)
          200: '#e5e7eb', // Borders and dividers
          300: '#d1d5db', // Subtle backgrounds
          400: '#9ca3af', // Muted text (used in templates)
          500: '#6b7280', // Secondary text
          600: '#4b5563', // Strong muted text (used in templates)
          700: '#374151', // Dark muted
          800: '#1f2937', // Very dark muted
          900: '#111827', // Near black (used in templates)
        },

        // ─────────────────────────────────────────────────────────────────────
        // Tailwind Blue Scale
        // ─────────────────────────────────────────────────────────────────────
        // Used in templates: border-blue-500
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary blue accent (used in templates)
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // ─────────────────────────────────────────────────────────────────────
        // Tailwind Red Scale (Destructive/Error States)
        // ─────────────────────────────────────────────────────────────────────
        // Used in templates: text-red-500
        // Maps to app's --destructive token
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Error/warning text (used in templates)
          600: '#dc2626',
          700: '#b91c1c', // App --destructive in light mode
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },

        // ─────────────────────────────────────────────────────────────────────
        // Semantic Color Aliases
        // ─────────────────────────────────────────────────────────────────────
        // Maps to app's semantic tokens for consistency
        destructive: {
          DEFAULT: '#b91c1c', // red-700 - matches app --destructive
          foreground: '#fef2f2', // red-50
        },

        // ─────────────────────────────────────────────────────────────────────
        // Legacy Custom Colors (Backward Compatible)
        // ─────────────────────────────────────────────────────────────────────
        // Keep these for existing templates - not part of main app design system
        primary: {
          500: '#667eea', // Purple gradient (custom)
          600: '#764ba2', // Purple gradient (custom)
        },
        danger: {
          100: '#f8d7da', // Bootstrap-inspired red
          200: '#f5c6cb',
          600: '#dc3545',
          900: '#721c24',
        },
        warning: {
          100: '#fff3cd', // Bootstrap-inspired yellow (used in auth-totp.tsx)
          200: '#ffc107', // Bootstrap-inspired yellow (used in auth-totp.tsx)
          900: '#856404',
        },
        info: {
          100: '#d1ecf1', // Bootstrap-inspired cyan
          200: '#bee5eb',
          600: '#0c5460',
          700: '#004085',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Courier New"', 'monospace'],
      },
    },
  },
};
