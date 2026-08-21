/** Sticker-style states for the hold type selector (ADR-005) */

export const holdTypeButtonBase =
  'flex items-center justify-center gap-1.5 border-2 border-foreground px-1.5 py-2 ' +
  'font-heading text-xs font-semibold uppercase tracking-wide cursor-pointer transition-all'

export const holdTypeButtonStates = {
  /** Pressed-down sticker: sits where the shadow was, in the wall's own tone */
  selected: 'bg-sand text-sand-foreground translate-x-0.5 translate-y-0.5 shadow-none',
  idle:
    'bg-card text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] ' +
    'hover:-translate-y-0.5 hover:shadow-[3px_4px_0_0_var(--color-foreground)]',
} as const

/**
 * Readout chips in the status strip. They sit on the scene rather than on the
 * page, and the scene is deep-water blue in either theme, so they carry their
 * own card fill: muted text straight on that blue is under 2:1.
 */
export const countChip =
  'inline-block border-2 border-foreground bg-card px-2.5 py-1 font-heading text-xs ' +
  'font-semibold uppercase tracking-wider text-foreground'

export const sectionLabel =
  'font-heading text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'

/** Poster chrome: the box every floating editor control lives in (ADR-005) */
export const chromePanel =
  'border-2 border-border bg-gradient-to-b from-card to-background ' +
  'shadow-[4px_4px_0_0_var(--color-foreground)]'

/**
 * A control's readout line: the seam a bend runs on, a measurement, a name.
 * Muted rather than accent: the pastel accent on a card is under 2:1.
 */
export const readoutLine =
  'font-mono text-[11px] uppercase tracking-wider text-muted-foreground'
