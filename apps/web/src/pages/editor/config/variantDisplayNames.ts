/**
 * Editor display names for model variants. The file names from the hold packs
 * (CH1_XS, BH_10x5_03) mean nothing to a route setter; these are climbing
 * names. Variants without an entry fall back to a mechanical prettify.
 */
export const variantDisplayNames: Record<string, string> = {
  // Jugs
  ch1_xs: 'BUCKET',
  ch2_xs: 'SCOOP',
  ch3_xs: 'HORN',
  ch4_xs: 'MOON',
  // Crimps
  bh_5x5_01: 'EDGE',
  bh_5x5_09: 'CHIP',
  bh_5x5_17: 'RAZOR',
  bh_5x5_25: 'PEBBLE',
  bh_5x5_33: 'WAVE',
  bh_5x5_41: 'BLADE',
  // Pinches
  bh_10x5_03: 'FIN',
  bh_10x5_12: 'SPINE',
  bh_10x5_21: 'TUFA',
  bh_10x5_30: 'RIB',
  // Pockets
  fh1_1: 'MONO',
  fh2_1: 'HUECO',
  fh3_1: 'DUO',
  fh4_1: 'OCULUS',
  // Slopers
  rockhold_t1_04: 'DOME',
  rockhold_t2_04: 'EGG',
  rockhold_t2_06: 'BOULDER',
  rockhold_t3_06: 'SHIELD',
  // Volumes
  vol_tetra_tall: 'TETRA TALL',
  vol_tetra_squat: 'TETRA',
  vol_tetra_ridge: 'TETRA WIDE',
  vol_rail_long: 'RAIL',
  vol_ramp: 'RAMP',
  vol_box: 'BOX',
}
