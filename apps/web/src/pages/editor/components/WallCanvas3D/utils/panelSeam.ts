import type { SeamOrientation } from '@crimp-studio/wall-geometry'

/**
 * Which seam a panel's angle drives, as an i18n key. A face hinges on exactly
 * one edge, so this is a readout rather than a picker: the root panel swings on
 * the floor line, the others on the seam they were cut along.
 */
export function getSeamLabelKey(orientation: SeamOrientation): string {
  if (orientation === 'horizontal') return 'editor.panel.seam.across'
  if (orientation === 'vertical') return 'editor.panel.seam.up'
  if (orientation === 'diagonal') return 'editor.panel.seam.slanted'
  return 'editor.panel.seam.floor'
}
