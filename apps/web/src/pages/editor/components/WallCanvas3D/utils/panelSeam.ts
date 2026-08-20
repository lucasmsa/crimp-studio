import type { HingeEdge } from './faceTree'

/**
 * Which seam a panel's angle drives, as an i18n key. A face hinges on exactly
 * one edge, so this is a readout rather than a picker: the root panel swings on
 * the floor line, a bottom hinge on the seam across the wall, a left hinge on
 * the seam up it.
 */
export function getSeamLabelKey(hinge: HingeEdge | null): string {
  if (hinge === 'bottom') return 'editor.panel.seam.across'
  if (hinge === 'left') return 'editor.panel.seam.up'
  return 'editor.panel.seam.floor'
}
