/**
 * What panels get painted, as opposed to what holds get moulded in.
 *
 * Unlike the hold set, these are not sourced from suppliers: nobody publishes
 * "the colours gyms paint walls". They are material tones, chosen so the panel
 * set and the hold set never share one. Hold colour carries meaning in this
 * editor, so a panel painted a hold colour would read as a hold type.
 */
export interface PanelSwatch {
  key: string
  hex: string
}

export const PANEL_SWATCHES: PanelSwatch[] = [
  { key: 'plywood', hex: '#E8D5B7' },
  { key: 'birch', hex: '#CFC5B4' },
  { key: 'bone', hex: '#F6F4F0' },
  { key: 'grey', hex: '#8A8F94' },
  { key: 'slate', hex: '#5A6B78' },
  { key: 'charcoal', hex: '#3A3F45' },
]
