import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { chromePanel } from '../../../config/editorControlStyles'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface SelectionCardProps {
  label: string
  testId: string
  cardRef: React.RefObject<HTMLDivElement | null>
  children: ReactNode
}

/** The card the current selection's controls live in, parked in the corner */
export function SelectionCard({ label, testId, cardRef, children }: SelectionCardProps) {
  const trapRef = useFocusTrap<HTMLDivElement>()

  return (
    <div ref={cardRef} className="pointer-events-auto">
      <div
        ref={trapRef}
        role="dialog"
        aria-label={label}
        className={cn('w-72 space-y-2 p-3', chromePanel)}
        data-testid={testId}
      >
        {children}
      </div>
    </div>
  )
}
