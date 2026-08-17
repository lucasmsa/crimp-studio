import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFaceSection } from '../hooks/useFaceSection'
import { holdTypeButtonBase, holdTypeButtonStates, sectionLabel } from '../config/wallConfigStyles'

/**
 * Shapes the focused panel: pick a gym angle or step to anything between,
 * split the panel, or give its surface back to the panel below.
 */
export function FaceSection() {
  const { t } = useTranslation()
  const {
    face,
    tilt,
    limits,
    presets,
    isEditingHold,
    cuts,
    canRemove,
    setAngle,
    stepAngle,
    cut,
    remove,
  } = useFaceSection()

  if (!face) return null

  const editingLabel = isEditingHold ? 'editor.face.editingHold' : 'editor.face.editingFace'
  /* A panel hinged on its left edge yaws around a vertical seam; one hinged on
     its bottom tilts. The presets alone did not say which, so the header does */
  const axisLabel = face.hinge === 'left' ? 'editor.face.axisWrap' : 'editor.face.axisTilt'

  return (
    <section className="space-y-3 border-b-2 border-border pb-6" data-testid="face-section">
      <h2 className={sectionLabel}>
        {t('editor.face.editing')}: {t(editingLabel)}
      </h2>
      <p className="font-mono text-[11px] uppercase tracking-wider text-accent" data-testid="face-axis">
        {t(axisLabel)}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => setAngle(preset.angle)}
            disabled={preset.angle > limits.max || preset.angle < limits.min}
            className={cn(
              holdTypeButtonBase,
              tilt === preset.angle ? holdTypeButtonStates.selected : holdTypeButtonStates.idle,
              'disabled:pointer-events-none disabled:opacity-40',
            )}
            data-testid={`face-angle-${preset.key}`}
          >
            {t(`editor.face.presets.${preset.key}`)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={(e) => stepAngle(-1, e.shiftKey)}
          aria-label={t('editor.face.decrease')}
          data-testid="face-angle-decrease"
        >
          -
        </Button>
        <span
          className="flex-1 border-2 border-border py-1 text-center font-mono text-sm tabular-nums text-foreground"
          data-testid="face-angle-value"
        >
          {t('editor.face.degrees', { value: tilt })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={(e) => stepAngle(1, e.shiftKey)}
          aria-label={t('editor.face.increase')}
          data-testid="face-angle-increase"
        >
          +
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => cut('across')}
          disabled={!cuts.across.ok}
          title={cuts.across.ok ? undefined : t(`editor.face.refusal.${cuts.across.reason}`)}
          className={cn(
            holdTypeButtonBase,
            holdTypeButtonStates.idle,
            'disabled:pointer-events-none disabled:opacity-40',
          )}
          data-testid="face-cut-across"
        >
          {t('editor.face.cutAcross')}
        </button>
        <button
          onClick={() => cut('up')}
          disabled={!cuts.up.ok}
          title={cuts.up.ok ? undefined : t(`editor.face.refusal.${cuts.up.reason}`)}
          className={cn(
            holdTypeButtonBase,
            holdTypeButtonStates.idle,
            'disabled:pointer-events-none disabled:opacity-40',
          )}
          data-testid="face-cut-up"
        >
          {t('editor.face.cutUp')}
        </button>
      </div>

      {canRemove && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={remove}
          data-testid="face-remove"
        >
          {t('editor.face.remove')}
        </Button>
      )}
    </section>
  )
}
