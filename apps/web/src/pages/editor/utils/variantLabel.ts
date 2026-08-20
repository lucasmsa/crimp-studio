import { variantDisplayNames } from '../config/variantDisplayNames'

/** Chip label for a model variant: curated climbing name when we have one,
    mechanical prettify ("bh_5x5_01" -> "5X5 01") as fallback */
export function formatVariantLabel(variant: string): string {
  return (
    variantDisplayNames[variant] ??
    variant
      .replace(/^(vol_|bh_)/, '')
      .replace(/_/g, ' ')
      .toUpperCase()
  )
}
