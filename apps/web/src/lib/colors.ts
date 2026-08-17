/**
 * Design tokens for use in JavaScript/TypeScript contexts
 * (Three.js lights, inline styles, etc.)
 *
 * These mirror the CSS variables in index.css.
 * For Tailwind classes, always use semantic classes like `bg-primary`.
 */

export const colors = {
  // Brand colors (ADR-005 amended 2026-08-17: graphite chrome, chalk primary.
  // Deep-water blue behind a sand wall read as sea and beach)
  primary: '#FAFAFA',
  secondary: '#456882',

  // Semantic colors
  success: '#22C55E',
  error: '#EF4444',

  // Dark mode palette
  dark: {
    background: '#14161A',
    surface: '#1E2229',
    border: '#6B7480',
    text: '#FAFAFA',
    textMuted: '#9BA5B0',
  },

  // Light mode palette
  light: {
    background: '#F5F4F2',
    surface: '#FFFFFF',
    border: '#9A948B',
    text: '#171717',
    textMuted: '#5A6470',
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
    surface: '#CFC5B4', // Birch plywood; the old sand read as beach against the chrome
    /* Scene lighting stays decoupled from brand tokens: the wall must look
       physically real regardless of art direction (ADR-005) */
    warmLight: '#FFDAB3',
  },

  // 3D scene (toon spike)
  scene: {
    outline: '#0D0F12', // ink outline hull for cel-shaded meshes
  },
} as const

// Type for color values
export type ColorToken = typeof colors
