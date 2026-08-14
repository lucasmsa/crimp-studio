import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { CM_TO_M } from '../constants/editor3d'
import { hasCollision } from '../utils/holdCollision'
import { clampHoldToFace } from '../utils/holdBounds'
import type { WallFace } from '../utils/faceTree'

/**
 * Handles all wall + hold interaction logic:
 * - Click wall to place holds
 * - Click hold to select
 * - Drag hold to reposition (snaps back on collision when dropped)
 *
 * Drag uses useFrame for buttery-smooth tracking every render frame,
 * plus a window-level pointerup so the drag ends even if the mouse
 * leaves the canvas entirely.
 */
export function useWallInteraction(face: WallFace) {
  const wallMeshRef = useRef<THREE.Mesh>(null)
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  const draggingHoldIdRef = useRef<string | null>(null)
  const pointerNDC = useRef(new THREE.Vector2(9999, 9999))
  const isDraggingRef = useRef(false)

  /* Pre-drag position — used to snap back if dropped on a collision */
  const dragStartPos = useRef<{ u: number; v: number } | null>(null)

  const { camera, gl } = useThree()

  const {
    selectedHoldId,
    addHold,
    selectHold,
    updateHold,
  } = useWallStore()

  /* The mesh is centered inside its face group, so its local frame is the
     face's rectangle measured from the middle */
  const worldToFaceCoords = useCallback((worldPoint: THREE.Vector3) => {
    if (!wallMeshRef.current) return null

    const localPoint = wallMeshRef.current.worldToLocal(worldPoint.clone())

    return {
      u: localPoint.x / CM_TO_M + face.width / 2,
      v: localPoint.y / CM_TO_M + face.height / 2,
    }
  }, [face.width, face.height])

  const clampToBounds = useCallback((u: number, v: number, holdId?: string) => {
    const box = holdId
      ? useWallStore.getState().wall.holds.find((h) => h.id === holdId)?.collisionBox
      : undefined
    return clampHoldToFace(u, v, box, face.width, face.height)
  }, [face.width, face.height])

  const setupDragPlane = useCallback(() => {
    if (wallMeshRef.current) {
      const wallPos = new THREE.Vector3()
      wallMeshRef.current.getWorldPosition(wallPos)
      /* World, not local: the mesh now sits under a face group that carries
         the hinge rotation */
      const worldQuaternion = new THREE.Quaternion()
      wallMeshRef.current.getWorldQuaternion(worldQuaternion)
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuaternion)
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, wallPos)
    }
  }, [])

  /* Track pointer position in NDC via native DOM events on the canvas */
  useEffect(() => {
    const canvas = gl.domElement

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerNDC.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointerNDC.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerUp = () => {
      const holdId = draggingHoldIdRef.current
      const startPos = dragStartPos.current

      /* Snap back if dropped on a collision */
      if (holdId && startPos) {
        const { wall: currentWall } = useWallStore.getState()
        const hold = currentWall.holds.find((h) => h.id === holdId)
        if (hold && hasCollision(hold, currentWall.holds)) {
          useWallStore.getState().updateHold(holdId, { u: startPos.u, v: startPos.v })
        }
      }

      draggingHoldIdRef.current = null
      dragStartPos.current = null
      isDraggingRef.current = false
      document.body.style.cursor = 'default'
    }

    canvas.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl.domElement])

  /* Every frame: if dragging, raycast from pointer to drag plane and update hold */
  const raycaster = useRef(new THREE.Raycaster())
  const intersectPoint = useRef(new THREE.Vector3())

  useFrame(() => {
    const holdId = draggingHoldIdRef.current
    if (!holdId) return

    raycaster.current.setFromCamera(pointerNDC.current, camera)

    if (raycaster.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint.current)) {
      const coords = worldToFaceCoords(intersectPoint.current)
      if (coords) {
        const clamped = clampToBounds(coords.u, coords.v, holdId)
        updateHold(holdId, { u: clamped.u, v: clamped.v })
      }
    }
  })

  /* Wall click — place or deselect */
  const handleWallPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()

    if (selectedHoldId) {
      selectHold(null)
      return
    }

    const coords = worldToFaceCoords(e.point)
    if (coords) {
      const clamped = clampToBounds(coords.u, coords.v)
      addHold(face.id, clamped.u, clamped.v)
    }
  }, [selectedHoldId, addHold, selectHold, worldToFaceCoords, clampToBounds, face.id])

  /* Hold pointer down — select + start drag, save pre-drag position */
  const handleHoldPointerDown = useCallback((holdId: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    selectHold(holdId)

    const hold = useWallStore.getState().wall.holds.find((h) => h.id === holdId)
    if (hold) {
      dragStartPos.current = { u: hold.u, v: hold.v }
    }

    draggingHoldIdRef.current = holdId
    isDraggingRef.current = true
    setupDragPlane()
    document.body.style.cursor = 'grabbing'
  }, [selectHold, setupDragPlane])

  return {
    wallMeshRef,
    isDragging: isDraggingRef,
    handleWallPointerDown,
    handleHoldPointerDown,
  }
}
