import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TapeCross } from '@/components/ui/TapeCross'

/**
 * Poster-style hero: giant skewed display type with a hard offset shadow
 * (double-layer text), slapped-on sticker badges, and climbing tape crosses.
 */
export function ScanHero() {
  const { t } = useTranslation()
  const title = t('scan.title').toUpperCase()

  return (
    <section className="relative flex flex-col items-center px-4 pt-20 pb-10 text-center">
      {/* Tape crosses pinned around the composition */}
      <TapeCross className="absolute left-[12%] top-16 h-14 w-14 opacity-80" />
      <TapeCross className="absolute right-[10%] top-40 h-10 w-10 rotate-12 opacity-60" />
      <TapeCross className="absolute bottom-4 left-[22%] h-8 w-8 -rotate-6 opacity-50" />

      {/* Coming-soon sticker */}
      <span
        className="inline-block -rotate-3 border-2 border-foreground bg-secondary px-4 py-1 font-mono text-sm uppercase tracking-widest text-secondary-foreground shadow-[4px_4px_0_0_var(--color-primary)] animate-in fade-in slide-in-from-top-4 duration-500"
        data-testid="scan-badge"
      >
        {t('scan.badge')}
      </span>

      {/* Layered poster title */}
      <h1
        className="relative mt-6 font-poster uppercase leading-none animate-in fade-in zoom-in-95 duration-700"
        data-testid="scan-title"
      >
        <span
          aria-hidden
          className="absolute left-2 top-2 block -skew-x-6 text-[clamp(5rem,22vw,14rem)] text-destructive select-none"
        >
          {title}
        </span>
        <span className="relative block -skew-x-6 text-[clamp(5rem,22vw,14rem)] text-foreground">
          {title}
        </span>
      </h1>

      <p
        className="mt-6 max-w-xl font-body text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
        data-testid="scan-tagline"
      >
        {t('scan.tagline')}
      </p>

      {/* Grade-tag sticker: the unknown grade of an unscanned wall */}
      <span
        aria-hidden
        className="absolute right-[14%] top-24 hidden rotate-6 border-2 border-foreground bg-success px-3 py-2 font-poster text-3xl text-success-foreground shadow-[5px_5px_0_0_var(--color-border)] md:inline-block"
      >
        {t('scan.grade')}
      </span>

      <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <Link
          to="/editor"
          className="inline-block border-2 border-foreground bg-primary px-6 py-3 font-heading font-bold uppercase tracking-wide text-primary-foreground shadow-[6px_6px_0_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5 hover:rotate-1 cursor-pointer"
          data-testid="scan-back-link"
        >
          {t('scan.backToStudio')}
        </Link>
      </div>
    </section>
  )
}
