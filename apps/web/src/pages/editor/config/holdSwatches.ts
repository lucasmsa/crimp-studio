/**
 * The colours holds actually come in, rather than a colour wheel.
 *
 * Chosen from the two sources that speak about gym use rather than catalogue
 * breadth: Setter Closet's nine core colours for Kilter and Tension board sets
 * (settercloset.com/pages/help-colors) and Skyhook Bouldering's eight-circuit
 * set. Every entry below appears in both, or in one of them plus all six
 * manufacturer ranges checked (Element, Atomik, So iLL, Setter Closet, Escape,
 * Secret Holds).
 *
 * On the hex: no manufacturer publishes measured hold colour. Nine of these
 * come from RAL codes that suppliers do publish (Secret Holds and So iLL both
 * sell RAL-coded holds), converted through Wikipedia's RAL Classic table, since
 * RAL is a physical standard and sRGB conversions differ between sources by as
 * much as #B81D13 vs #CC0605 for the same code. Pink has no RAL from either
 * supplier, so it takes Element Climbing's published swatch, which is nominal.
 *
 * Grey is here for volumes rather than for plastic. It stays clear of the panel
 * set's grey (#8A8F94) so that a grey volume does not read as a painted panel.
 */
export interface HoldSwatch {
  key: string
  hex: string
  /** Where the value came from, so a future edit knows what it is overriding */
  source: string
}

export const HOLD_SWATCHES: HoldSwatch[] = [
  { key: 'red', hex: '#C1121C', source: 'RAL 3020 traffic red' },
  { key: 'orange', hex: '#E75B12', source: 'RAL 2004 pure orange' },
  { key: 'yellow', hex: '#F7B500', source: 'RAL 1023 traffic yellow' },
  { key: 'green', hex: '#25E712', source: 'RAL 6037 pure green' },
  { key: 'blue', hex: '#2874B2', source: 'RAL 5015 sky blue' },
  { key: 'purple', hex: '#904684', source: 'RAL 4008 signal violet' },
  { key: 'pink', hex: '#EE5FBE', source: 'Element Climbing swatch, nominal' },
  { key: 'black', hex: '#0A0A0D', source: 'RAL 9005 jet black' },
  { key: 'grey', hex: '#7D7F7D', source: 'RAL 7037 dusty grey' },
  { key: 'white', hex: '#F7F9EF', source: 'RAL 9010 pure white' },
]
