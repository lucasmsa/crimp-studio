/** Sticker-style states for the hold type selector (ADR-005) */

export const holdTypeButtonBase =
  'flex items-center justify-center gap-1.5 border-2 border-foreground px-1.5 py-2 ' +
  'font-heading text-xs font-semibold uppercase tracking-wide cursor-pointer transition-all'

export const holdTypeButtonStates = {
  /** Pressed-down sticker: sits where the shadow was */
  selected: 'bg-primary text-primary-foreground translate-x-0.5 translate-y-0.5 shadow-none',
  idle:
    'bg-card text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] ' +
    'hover:-translate-y-0.5 hover:shadow-[3px_4px_0_0_var(--color-foreground)]',
} as const

export const sectionLabel =
  'font-mono text-[11px] uppercase tracking-widest text-muted-foreground'

export const colorInput =
  'h-10 w-16 border-2 border-foreground bg-card p-1 cursor-pointer ' +
  'shadow-[3px_3px_0_0_var(--color-foreground)]'
