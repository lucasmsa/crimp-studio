import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <h1 className="text-4xl font-bold font-heading text-primary">
          {t('about.title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('about.subtitle')}
        </p>

        {/* Story */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold font-heading">
            {t('about.story.title')}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t('about.story.content')}
          </p>
        </section>

        {/* How it Works */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold font-heading">
            {t('about.howItWorks.title')}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-medium">{t('about.howItWorks.step1.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('about.howItWorks.step1.description')}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-medium">{t('about.howItWorks.step2.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('about.howItWorks.step2.description')}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-medium">{t('about.howItWorks.step3.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('about.howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold font-heading">
            {t('about.roadmap.title')}
          </h2>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-success">●</span>
              <span>{t('about.roadmap.v0')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">○</span>
              <span className="text-muted-foreground">{t('about.roadmap.v1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">○</span>
              <span className="text-muted-foreground">{t('about.roadmap.v2')}</span>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold font-heading">
            {t('about.credits.title')}
          </h2>
          <div className="mt-4 text-muted-foreground">
            <p>{t('about.credits.model')}</p>
            <a
              href="https://sketchfab.com/evan4129"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              EFX on Sketchfab
            </a>
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
