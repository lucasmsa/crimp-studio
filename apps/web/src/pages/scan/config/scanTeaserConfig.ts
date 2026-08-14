export interface ScanStepConfig {
  key: 'shoot' | 'detect' | 'beta'
  /** Step number stamp shown on the sticker */
  stamp: string
  /** Sticker tilt, alternating like slapped-on skate stickers */
  rotationClass: string
  /** Accent classes for the sticker header bar */
  accentClass: string
  /** Entrance animation delay utility */
  delayClass: string
}

export const scanSteps: ScanStepConfig[] = [
  {
    key: 'shoot',
    stamp: '01',
    rotationClass: '-rotate-2',
    accentClass: 'bg-primary text-primary-foreground',
    delayClass: 'delay-300',
  },
  {
    key: 'detect',
    stamp: '02',
    rotationClass: 'rotate-1',
    accentClass: 'bg-success text-success-foreground',
    delayClass: 'delay-500',
  },
  {
    key: 'beta',
    stamp: '03',
    rotationClass: '-rotate-1',
    accentClass: 'bg-destructive text-destructive-foreground',
    delayClass: 'delay-700',
  },
]

/** How many times the marquee phrase repeats to fill the tape loop */
export const MARQUEE_REPEATS = 8
