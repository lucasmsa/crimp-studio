import { useTranslation } from 'react-i18next'
import { scanSteps } from '../config/scanTeaserConfig'

/**
 * The three-step flow as tilted sticker cards: shoot, detect, beta.
 */
export function StepsBoard() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-3" data-testid="scan-steps">
      {scanSteps.map((step) => (
        <article
          key={step.key}
          className={`${step.rotationClass} ${step.delayClass} border-2 border-foreground bg-card shadow-[8px_8px_0_0_var(--color-border)] transition-transform hover:rotate-0 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both`}
          data-testid={`scan-step-${step.key}`}
        >
          <header className={`${step.accentClass} flex items-baseline justify-between border-b-2 border-foreground px-4 py-2`}>
            <span className="font-poster text-3xl">{step.stamp}</span>
            <span className="font-mono text-xs uppercase tracking-widest">{t('scan.status')}</span>
          </header>
          <div className="px-4 py-5 text-left">
            <h2 className="font-heading text-xl font-bold uppercase text-foreground">
              {t(`scan.steps.${step.key}.title`)}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t(`scan.steps.${step.key}.description`)}
            </p>
          </div>
        </article>
      ))}
    </section>
  )
}
