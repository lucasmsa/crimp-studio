/**
 * Design tokens for use in JavaScript/TypeScript contexts
 * (Three.js lights, inline styles, etc.)
 *
 * These mirror the CSS variables in index.css.
 * For Tailwind classes, always use semantic classes like `bg-primary`.
 */

export const colors = {
  // Brand colors (ADR-005 amended 2026-08-12: industrial palette, beige primary on dark)
  primary: '#D2C1B6',
  secondary: '#456882',

  // Semantic colors
  success: '#22C55E',
  error: '#EF4444',

  // Dark mode palette
  dark: {
    background: '#1B3C53',
    surface: '#234C6A',
    border: '#456882',
    text: '#FAFAFA',
    textMuted: '#A8BCCB',
  },

  // Light mode palette
  light: {
    background: '#F2EDE7',
    surface: '#FFFFFF',
    border: '#D2C1B6',
    text: '#171717',
    textMuted: '#5C6B78',
  },

  // Hold types - for wall editor
  holds: {
    jug: '#22C55E',
    crimp: '#EF4444',
    sloper: '#3B82F6',
    pinch: '#F59E0B',
    pocket: '#8B5CF6',
    volume: '#6B7280',
  },

  // Wall editor canvas
  wall: {
    surface: '#E8D5B7', // Plywood/sand color for climbing wall
    /* Scene lighting stays decoupled from brand tokens: the wall must look
       physically real regardless of art direction (ADR-005) */
    warmLight: '#FFDAB3',
  },

  // 3D scene (toon spike)
  scene: {
    outline: '#14242F', // ink-navy outline hull for cel-shaded meshes
  },
} as const

// Type for color values
export type ColorToken = typeof colors
