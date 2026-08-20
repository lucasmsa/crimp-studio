import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Holds keyboard focus inside a popover while it is open, and puts the first
 * control under the cursor's keyboard equivalent as soon as it appears.
 *
 * Tab is caught on the document rather than on the popover: the click that
 * opened it left focus on the canvas, so a listener bound to the popover would
 * never see the first Tab. Escape dismisses, which is the way back out.
 */
export function useFocusTrap<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  const controls = useCallback(
    () => Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
    [],
  )

  useEffect(() => {
    /* Next frame, not this one: the popover is portalled into the canvas
       overlay and is not in the document yet on the pass this effect runs on,
       where nothing can take focus */
    const frame = requestAnimationFrame(() => controls()[0]?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const items = controls()
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      const inside = ref.current?.contains(document.activeElement)

      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [controls])

  return ref
}
