import { useTranslation } from 'react-i18next'
import { MARQUEE_REPEATS } from '../config/scanTeaserConfig'

/**
 * Skate-video ticker strip. The phrase list renders twice so the
 * -50% translate loop is seamless.
 */
export function TickerTape() {
  const { t } = useTranslation()

  const phrases = Array.from({ length: MARQUEE_REPEATS }, () => t('scan.marquee'))

  return (
    <div
      className="relative -rotate-1 border-y-4 border-foreground bg-primary py-2 overflow-hidden"
      data-testid="scan-ticker"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {[0, 1].map((half) => (
          <div key={half} aria-hidden={half === 1} className="flex shrink-0">
            {phrases.map((phrase, i) => (
              <span
                key={i}
                className="mx-6 font-poster text-2xl uppercase tracking-wide text-primary-foreground"
              >
                {phrase}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
