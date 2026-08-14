import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Scene } from '@/components/three'
import { Button } from '@/components/ui/button'
import { TapeCross } from '@/components/ui/TapeCross'

export function Hero() {
  const { t } = useTranslation()
  const title = t('landing.hero.title').toUpperCase()

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-10 px-6 py-16 overflow-hidden">
      <TapeCross className="absolute left-[6%] top-[12%] h-12 w-12 opacity-70" />
      <TapeCross className="absolute right-[8%] bottom-[10%] h-9 w-9 rotate-12 opacity-50" />

      <div className="flex-1 max-w-xl">
        {/* Layered poster title */}
        <h1
          className="relative font-poster uppercase leading-none animate-in fade-in zoom-in-95 duration-700"
          data-testid="landing-title"
        >
          <span
            aria-hidden
            className="absolute left-3 top-3 block -skew-x-6 text-[clamp(3.5rem,9vw,7rem)] text-primary-foreground select-none"
          >
            {title}
          </span>
          <span className="relative block -skew-x-6 text-[clamp(3.5rem,9vw,7rem)] text-foreground">
            {title}
          </span>
        </h1>

        <p className="mt-6 text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {t('landing.hero.subtitle')}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Button size="lg" asChild>
            <Link to="/editor">{t('landing.cta.openEditor')}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/about">{t('landing.cta.learnMore')}</Link>
          </Button>
          {/* Scan teaser sticker */}
          <Link
            to="/scan"
            className="inline-block -rotate-2 border-2 border-foreground bg-accent px-3 py-2 font-heading text-xs font-semibold uppercase tracking-wide text-accent-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-transform hover:rotate-0 hover:-translate-y-0.5 cursor-pointer"
            data-testid="landing-scan-sticker"
          >
            {t('landing.cta.scanSoon')}
          </Link>
        </div>

        <p className="mt-12 inline-block border-2 border-border px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {t('common.version')}
        </p>
      </div>

      {/* Shoe scene framed like a trading card */}
      <div className="relative flex-1 w-full max-w-xl aspect-square rotate-1 border-2 border-foreground bg-gradient-to-b from-card to-background shadow-[10px_10px_0_0_var(--color-foreground)] animate-in fade-in duration-1000 delay-200">
        <TapeCross className="absolute -left-4 -top-4 h-10 w-10 opacity-90" />
        <TapeCross className="absolute -right-3 -bottom-3 h-8 w-8 rotate-6 opacity-80" />
        <Scene className="w-full h-full" />
      </div>
    </section>
  )
}
