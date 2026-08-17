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
  primary: '#0F1720',
  secondary: '#1B6FE0',
  /* Interaction only: at 16 degrees from crimp red and 22 from pinch amber,
     an orange fill on anything wall-sized reads as a hold type */
  accent: '#1B6FE0',

  // Semantic colors
  success: '#35D07F',
  error: '#EF4444',

  // Dark mode palette
  dark: {
    background: '#131518',
    surface: '#20242A',
    border: '#6A737F',
    text: '#F3F0E8',
    textMuted: '#A9B0B9',
  },

  // Light mode palette
  light: {
    background: '#EDF1F6',
    surface: '#FFFFFF',
    border: '#8593A6',
    text: '#0F1720',
    textMuted: '#55606E',
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
    /* The viewport keeps its own tone rather than taking the page's: a birch
       wall on a near-white page is 1.5:1 and stops reading as an object at
       all. Steel blue is the gym floor, and it puts the wall in front of it */
    viewport: '#4F6478',
    outline: '#0B0D10', // ink outline hull for cel-shaded meshes
  },
} as const

// Type for color values
export type ColorToken = typeof colors
