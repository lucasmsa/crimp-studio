import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { placePopover } from '../utils/popoverPlacement'

/* The camera eases into a new framing whenever the wall changes shape, which
   walks an anchor across the screen a fraction of a pixel at a time. Moving the
   popover only once it is this far out keeps it still through the small stuff. */
const DEADZONE_PX = 12

/**
 * Keeps a popover beside its anchor and inside the canvas.
 *
 * The offset is written straight to the element's style rather than held in
 * state: orbiting moves the anchor across the screen every frame, and a
 * re-render per frame would cost more than the wall does.
 *
 * The anchor is read as a world position off the mounted object rather than
 * from the coordinates it was given, because the wall sits under a group that
 * recentres it on screen.
 */
export function usePopoverPlacement(
  anchorRef: React.RefObject<THREE.Object3D | null>,
  elementRef: React.RefObject<HTMLElement | null>,
) {
  const camera = useThree((state) => state.camera)
  const viewport = useThree((state) => state.size)
  const projected = useRef(new THREE.Vector3())
  const popover = useRef({ width: 0, height: 0 })
  const written = useRef({ x: 0, y: 0, settled: false })

  /* A popover is portalled into the canvas overlay, so it is not in the
     document on the pass where this effect first runs and measures nothing.
     The frame loop below takes the first real box it can get. */
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new ResizeObserver(() => {
      popover.current = { width: element.offsetWidth, height: element.offsetHeight }
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [elementRef])

  useFrame(() => {
    const element = elementRef.current
    if (!element || !anchorRef.current) return

    if (popover.current.height === 0) {
      popover.current = { width: element.offsetWidth, height: element.offsetHeight }
    }

    anchorRef.current.getWorldPosition(projected.current).project(camera)
    const placement = placePopover({
      anchorNdc: projected.current,
      viewport,
      popover: popover.current,
    })

    const drift = Math.hypot(placement.x - written.current.x, placement.y - written.current.y)
    if (written.current.settled && drift < DEADZONE_PX) return

    written.current = { x: placement.x, y: placement.y, settled: true }
    element.style.transform = `translate(${placement.x}px, ${placement.y}px)`
    element.dataset.side = placement.side
  })
}
