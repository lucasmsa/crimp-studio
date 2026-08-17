import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { HOLD_SWATCHES } from '../config/holdSwatches'

interface HoldSwatchesProps {
  value?: string
  onPick: (hex: string) => void
}

/** The colours a setter actually reaches for, as a row of chalk-ringed dots */
export function HoldSwatches({ value, onPick }: HoldSwatchesProps) {
  const { t } = useTranslation()
  const active = value?.toUpperCase()

  return (
    <div className="flex flex-wrap gap-2" data-testid="hold-swatches">
      {HOLD_SWATCHES.map((swatch) => (
        <button
          key={swatch.key}
          onClick={() => onPick(swatch.hex)}
          title={t(`editor.swatches.${swatch.key}`)}
          aria-label={t(`editor.swatches.${swatch.key}`)}
          aria-pressed={active === swatch.hex}
          className={cn(
            'h-6 w-6 shrink-0 cursor-pointer rounded-full border-2 transition-transform',
            'hover:-translate-y-0.5',
            active === swatch.hex
              ? 'border-primary shadow-[0_0_0_2px_var(--color-primary)]'
              : 'border-foreground/50',
          )}
          style={{ backgroundColor: swatch.hex }}
          data-testid={`hold-swatch-${swatch.key}`}
        />
      ))}
    </div>
  )
}
