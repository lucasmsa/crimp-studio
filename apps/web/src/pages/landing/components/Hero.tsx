import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Scene } from '@/components/three'
import { Button } from '@/components/ui/button'

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 px-4 py-16">
      <div className="flex-1 max-w-xl">
        <h1 className="text-5xl md:text-6xl font-bold font-heading text-primary">
          {t('landing.hero.title')}
        </h1>
        <p className="mt-6 text-xl text-muted-foreground">
          {t('landing.hero.subtitle')}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button size="lg" asChild>
            <Link to="/editor">{t('landing.cta.openEditor')}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/about">{t('landing.cta.learnMore')}</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm font-mono text-muted-foreground">
          {t('common.version')}
        </p>
      </div>
      <div className="flex-1 w-full max-w-xl aspect-square">
        <Scene className="w-full h-full" />
      </div>
    </section>
  )
}
