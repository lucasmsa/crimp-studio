import { ScanHero } from './components/ScanHero'
import { StepsBoard } from './components/StepsBoard'
import { TickerTape } from './components/TickerTape'

/**
 * Scan pillar teaser: photo in, problems and beta out. Poster energy
 * borrowed from early-2000s skate games while the real thing is built
 * (PRD: docs/prd/scan.md).
 */
export function ScanPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <ScanHero />
      <TickerTape />
      <StepsBoard />
    </div>
  )
}
