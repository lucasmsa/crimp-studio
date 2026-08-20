import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { cn } from '@/lib/utils'
import { chromePanel } from '../../../config/editorControlStyles'
import { usePopoverPlacement } from '../hooks/usePopoverPlacement'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface SelectionPopoverProps {
  /** Settled wall-space point the popover hangs off */
  anchor: THREE.Vector3
  label: string
  testId: string
  children: ReactNode
}

/**
 * The box the current selection's controls live in.
 *
 * `Html` without `transform` is plain DOM projected to a screen point, so the
 * popover keeps its own orientation: a roof panel rotates to face the ceiling
 * and its controls stay upright and readable.
 */
export function SelectionPopover({ anchor, label, testId, children }: SelectionPopoverProps) {
  const anchorRef = useRef<THREE.Group>(null)
  const trapRef = useFocusTrap<HTMLDivElement>()
  usePopoverPlacement(anchorRef, trapRef)

  return (
    <group ref={anchorRef} position={anchor}>
      <Html style={{ pointerEvents: 'auto' }} zIndexRange={[100, 0]}>
        <div
          ref={trapRef}
          role="dialog"
          aria-label={label}
          className={cn('w-72 space-y-2 p-3', chromePanel)}
          data-testid={testId}
        >
          {children}
        </div>
      </Html>
    </group>
  )
}
