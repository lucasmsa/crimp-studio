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
  /* What a hold is painted before anyone paints it. Every one of these is a
     value from HOLD_SWATCHES, so an unpainted hold always lights up a swatch and
     the rail's legend dot matches what is on the wall (ADR-008). The test in
     lib/__tests__/colors.test.ts is what keeps the two in step */
  holds: {
    jug: '#25E712',    // green
    crimp: '#C1121C',  // red
    sloper: '#2874B2', // blue
    pinch: '#E75B12',  // orange
    pocket: '#904684', // purple
    volume: '#7D7F7D', // grey
  },

  // Wall editor canvas
  wall: {
    /* Panels start painted rather than raw: most gyms paint every panel, and
       plywood stays a swatch away */
    surface: '#F6F4F0',
    /* Scene lighting stays decoupled from brand tokens: the wall must look
       physically real regardless of art direction (ADR-005) */
    warmLight: '#FFDAB3',
  },

  // 3D scene (toon spike)
  scene: {
    /* The room the wall stands in, per theme: deep water in the dark one, a
       gym's white wall fading to its floor in the light one. Both the canvas
       gradient and the fade an unfocused panel takes read from here */
    room: {
      dark: { top: '#23506E', bottom: '#102532' },
      light: { top: '#D9DCDF', bottom: '#99A1A8' },
    },
    outline: '#14242F', // ink outline hull for cel-shaded meshes
  },
} as const

// Type for color values
export type ColorToken = typeof colors
