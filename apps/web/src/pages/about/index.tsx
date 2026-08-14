import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TapeCross } from '@/components/ui/TapeCross'

const sectionTitle = 'font-heading text-2xl font-semibold uppercase tracking-wide'

export function AboutPage() {
  const { t } = useTranslation()
  const title = t('about.title').toUpperCase()

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="relative max-w-3xl mx-auto px-6 py-16">

        {/* Poster header */}
        <h1 className="relative font-poster uppercase leading-none" data-testid="about-title">
          <span
            aria-hidden
            className="absolute left-2.5 top-2.5 block -skew-x-6 text-[clamp(3rem,10vw,5.5rem)] text-primary-foreground select-none"
          >
            {title}
          </span>
          <span className="relative block -skew-x-6 text-[clamp(3rem,10vw,5.5rem)] text-foreground">
            {title}
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('about.subtitle')}</p>

        {/* Story */}
        <section className="mt-14">
          <h2 className={sectionTitle}>{t('about.story.title')}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t('about.story.content')}</p>
        </section>

        {/* Pillars */}
        <section className="mt-14">
          <h2 className={sectionTitle}>{t('about.pillars.title')}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <article
              className="relative -rotate-1 border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--color-border)] transition-transform hover:rotate-0"
              data-testid="about-pillar-studio"
            >
              <TapeCross className="absolute -left-3 -top-3 h-7 w-7 opacity-90" />
              <header className="border-b-2 border-foreground bg-primary px-4 py-2">
                <span className="font-poster text-2xl uppercase text-primary-foreground">
                  {t('about.pillars.studio.title')}
                </span>
              </header>
              <p className="px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                {t('about.pillars.studio.description')}
              </p>
            </article>
            <article
              className="rotate-1 border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--color-border)] transition-transform hover:rotate-0"
              data-testid="about-pillar-scan"
            >
              <header className="border-b-2 border-foreground bg-accent px-4 py-2">
                <span className="font-poster text-2xl uppercase text-accent-foreground">
                  {t('about.pillars.scan.title')}
                </span>
              </header>
              <p className="px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                {t('about.pillars.scan.description')}
              </p>
            </article>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mt-14">
          <h2 className={sectionTitle}>{t('about.roadmap.title')}</h2>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-3">
              <span className="inline-block border-2 border-foreground bg-success px-1.5 font-mono text-xs font-bold text-success-foreground">
                ✓
              </span>
              <span>{t('about.roadmap.done')}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block -rotate-3 border-2 border-foreground bg-primary px-1.5 font-mono text-xs font-bold uppercase text-primary-foreground">
                →
              </span>
              <span>{t('about.roadmap.now')}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block border-2 border-border px-1.5 font-mono text-xs font-bold text-muted-foreground">
                ○
              </span>
              <span className="text-muted-foreground">{t('about.roadmap.next')}</span>
            </li>
          </ul>
        </section>

        {/* Credits */}
        <section className="mt-14">
          <h2 className={sectionTitle}>{t('about.credits.title')}</h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>
              {t('about.credits.holds')}{' '}
              <a
                href="https://www.printables.com/@JeremyLAFAYE_2080610"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-4"
              >
                Jérémy LAFAYE
              </a>{' '}
              (
              <a
                href="https://github.com/JeremSparte/BHToolset"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-4"
              >
                BHToolset
              </a>
              , CC BY-SA)
            </p>
            <p>
              {t('about.credits.model')}{' '}
              <a
                href="https://sketchfab.com/evan4129"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-4"
              >
                EFX on Sketchfab
              </a>
            </p>
          </div>
        </section>

        {/* Back */}
        <div className="mt-16">
          <Button variant="outline" asChild>
            <Link to="/">{t('common.backHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
