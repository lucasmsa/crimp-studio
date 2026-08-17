/**
 * Design tokens for use in JavaScript/TypeScript contexts
 * (Three.js lights, inline styles, etc.)
 *
 * These mirror the CSS variables in index.css.
 * For Tailwind classes, always use semantic classes like `bg-primary`.
 */

export const colors = {
  // Brand colours (ADR-005). Deep-water blue chrome with pastel accents: sky
  // leads interaction, pink marks attention, mint means success. On this blue
  // each works as text and as a fill carrying ink text
  primary: '#87CEFA',
  secondary: '#FFB6C1',
  /* Interaction only: at 16 degrees from crimp red and 22 from pinch amber,
     an orange fill on anything wall-sized reads as a hold type */
  accent: '#FFB6C1',

  // Semantic colors
  success: '#98FB98',
  error: '#EF4444',

  // Dark mode palette
  dark: {
    background: '#1B3C53',
    surface: '#234C6A',
    border: '#6B8EAB',
    text: '#F7F3E8',
    textMuted: '#A8BCCB',
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
    surface: '#E8D5B7', // Plywood; reads warm against the deep-water chrome
    /* Scene lighting stays decoupled from brand tokens: the wall must look
       physically real regardless of art direction (ADR-005) */
    warmLight: '#FFDAB3',
  },

  // 3D scene (toon spike)
  scene: {
    /* The viewport matches the page: plywood on deep-water blue is 8:1, so
       the wall reads as an object without a separate backdrop tone */
    viewport: '#1B3C53',
    outline: '#14242F', // ink outline hull for cel-shaded meshes
  },
} as const

// Type for color values
export type ColorToken = typeof colors
