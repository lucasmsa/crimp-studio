/**
 * Design tokens for use in JavaScript/TypeScript contexts
 * (Three.js lights, inline styles, etc.)
 *
 * These mirror the CSS variables in index.css.
 * For Tailwind classes, always use semantic classes like `bg-primary`.
 */

export const colors = {
  // Brand colors
  primary: '#FFDAB3',
  secondary: '#FFC107',

  // Semantic colors
  success: '#22C55E',
  error: '#EF4444',

  // Dark mode palette
  dark: {
    background: '#0A0A0A',
    surface: '#171717',
    border: '#2A2A2A',
    text: '#FAFAFA',
    textMuted: '#94A3B8',
  },

  // Light mode palette
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#E5E5E5',
    text: '#171717',
    textMuted: '#6B7280',
  },
} as const

// Type for color values
export type ColorToken = typeof colors
