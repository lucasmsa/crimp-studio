import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface Swatch {
  key: string
  hex: string
}

interface ColorSwatchesProps {
  swatches: Swatch[]
  value?: string
  /** i18n prefix the swatch keys hang off, e.g. editor.swatches */
  labelPrefix: string
  testIdPrefix: string
  onPick: (hex: string) => void
}

/** A row of colour dots. The only way to set a colour: there is no wheel */
export function ColorSwatches({
  swatches,
  value,
  labelPrefix,
  testIdPrefix,
  onPick,
}: ColorSwatchesProps) {
  const { t } = useTranslation()
  const active = value?.toUpperCase()

  return (
    <div className="flex flex-wrap gap-2" data-testid={testIdPrefix}>
      {swatches.map((swatch) => (
        <button
          key={swatch.key}
          onClick={() => onPick(swatch.hex)}
          title={t(`${labelPrefix}.${swatch.key}`)}
          aria-label={t(`${labelPrefix}.${swatch.key}`)}
          aria-pressed={active === swatch.hex}
          className={cn(
            'h-6 w-6 shrink-0 cursor-pointer rounded-full border-2 transition-transform',
            'hover:-translate-y-0.5',
            active === swatch.hex
              ? 'border-primary shadow-[0_0_0_2px_var(--color-primary)]'
              : 'border-foreground/50',
          )}
          style={{ backgroundColor: swatch.hex }}
          data-testid={`${testIdPrefix}-${swatch.key}`}
        />
      ))}
    </div>
  )
}
