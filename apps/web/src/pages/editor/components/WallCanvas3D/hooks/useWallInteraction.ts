import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { CM_TO_M } from '@crimp-studio/wall-geometry'
import { resolveWallTap } from '../utils/wallGesture'

/** A press that moves further or lasts longer than this is a drag, not a tap */
const TAP_SLOP_PX = 6
const TAP_MS = 400

interface PointerDown {
  clientX: number
  clientY: number
  time: number
  faceId: string
  u: number
  v: number
}

/**
 * Handles all wall + hold interaction logic:
 * - Tap a face to focus it, tap again inside it to place a hold
 * - Click hold to select
 * - Drag hold to reposition, stopping wherever it no longer fits
 *
 * Taps resolve on pointerup rather than pointerdown so that orbiting the
 * camera from the wall does not drop a hold on the way past.
 *
 * Drag uses useFrame for buttery-smooth tracking every render frame,
 * plus a window-level pointerup so the drag ends even if the mouse
 * leaves the canvas entirely.
 */
export function useWallInteraction() {
  const faceMeshes = useRef(new Map<string, THREE.Mesh>())
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  const draggingHoldIdRef = useRef<string | null>(null)
  /** The face a seam is being drawn on, while a blade or trim drag is in progress */
  const drawingOnFaceRef = useRef<string | null>(null)
  const pointerNDC = useRef(new THREE.Vector2(9999, 9999))
  const isDraggingRef = useRef(false)
  const pointerDownRef = useRef<PointerDown | null>(null)

  const { camera, gl } = useThree()

  const registerFaceMesh = useCallback(
    (faceId: string) => (mesh: THREE.Mesh | null) => {
      if (mesh) faceMeshes.current.set(faceId, mesh)
      else faceMeshes.current.delete(faceId)
    },
    [],
  )

  /* The mesh is built in its face's own frame, so its local coordinates are
     the face's, in metres */
  const worldToFaceCoords = useCallback((faceId: string, worldPoint: THREE.Vector3) => {
    const mesh = faceMeshes.current.get(faceId)
    if (!mesh) return null

    const localPoint = mesh.worldToLocal(worldPoint.clone())

    return { u: localPoint.x / CM_TO_M, v: localPoint.y / CM_TO_M }
  }, [])

  const setupDragPlane = useCallback((faceId: string) => {
    const mesh = faceMeshes.current.get(faceId)
    if (!mesh) return

    const facePos = new THREE.Vector3()
    mesh.getWorldPosition(facePos)
    /* World, not local: the mesh sits under a face group carrying the hinge
       rotation, so its own quaternion says nothing about where it faces */
    const worldQuaternion = new THREE.Quaternion()
    mesh.getWorldQuaternion(worldQuaternion)
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuaternion)
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, facePos)
  }, [])

  /* Track pointer position in NDC via native DOM events on the canvas */
  useEffect(() => {
    const canvas = gl.domElement

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerNDC.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointerNDC.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerUp = (e: PointerEvent) => {
      /* Letting go is what commits a seam. A press that never drew one is a
         tap, and falls through to selecting the panel */
      if (drawingOnFaceRef.current) {
        const store = useWallStore.getState()
        if (store.drawnSeam?.seam) {
          store.releaseSeam()
          pointerDownRef.current = null
        } else {
          store.cancelSeam()
        }
      }

      const down = pointerDownRef.current
      if (down && isTap(down, e)) resolveTap(down)

      /* Letting go is what commits the move. A hold let go over a neighbour
         has nowhere to land, and springs back to where it was picked up */
      if (draggingHoldIdRef.current) useWallStore.getState().dropHold()

      pointerDownRef.current = null
      draggingHoldIdRef.current = null
      drawingOnFaceRef.current = null
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

  /* Every frame while dragging: whichever panel the pointer is over takes the
     hold, which is how a hold crosses a seam onto its neighbour */
  const raycaster = useRef(new THREE.Raycaster())
  const intersectPoint = useRef(new THREE.Vector3())

  const faceUnderPointer = useCallback((): { faceId: string; point: THREE.Vector3 } | null => {
    const meshes = [...faceMeshes.current.entries()]
    const hits = raycaster.current.intersectObjects(
      meshes.map(([, mesh]) => mesh),
      false,
    )
    if (hits.length === 0) return null

    const entry = meshes.find(([, mesh]) => mesh === hits[0].object)
    return entry ? { faceId: entry[0], point: hits[0].point } : null
  }, [])

  /* Every frame while drawing a seam: the line runs through where the panel
     was pressed and where the pointer is now, on that panel. Past the panel's
     edge the pointer keeps aiming on the panel's own plane */
  const aimSeamAtPointer = useCallback(
    (faceId: string) => {
      const mesh = faceMeshes.current.get(faceId)
      if (!mesh) return

      raycaster.current.setFromCamera(pointerNDC.current, camera)
      const hit = raycaster.current.intersectObject(mesh, false)[0]
      const point =
        hit?.point ??
        (raycaster.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint.current)
          ? intersectPoint.current
          : null)
      if (!point) return

      const coords = worldToFaceCoords(faceId, point)
      if (coords) useWallStore.getState().aimSeam([coords.u, coords.v])
    },
    [camera, worldToFaceCoords],
  )

  useFrame(() => {
    if (drawingOnFaceRef.current) {
      aimSeamAtPointer(drawingOnFaceRef.current)
      return
    }

    const holdId = draggingHoldIdRef.current
    if (!holdId) return

    const state = useWallStore.getState()
    const hold = state.wall.holds.find((h) => h.id === holdId)
    if (!hold) return
    const heldFaceId = state.heldHold?.faceId ?? hold.faceId

    raycaster.current.setFromCamera(pointerNDC.current, camera)

    /* Over a panel, the hold goes there. Past the edge of the wall it keeps
       sliding on the plane of the panel it is already on, so a drag that leaves
       the wall clamps at the edge instead of stopping dead */
    const over = faceUnderPointer()
    const target =
      over ??
      (raycaster.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint.current)
        ? { faceId: heldFaceId, point: intersectPoint.current }
        : null)
    if (!target) return

    const coords = worldToFaceCoords(target.faceId, target.point)
    /* The hold goes where the pointer goes and says what it is sitting on,
       rather than being stopped by it (ADR-007, amended) */
    if (coords) useWallStore.getState().holdHold(holdId, coords.u, coords.v, target.faceId)

    /* The plane follows the panel the hold is over, so leaving the wall from a
       bent panel slides along that panel rather than the one it started on */
    if (over && over.faceId !== heldFaceId) setupDragPlane(over.faceId)
  })

  /* Face press: remembered, then resolved on release. With a blade or trim
     armed it also starts a seam, which the release commits or cancels */
  const handleFacePointerDown = useCallback(
    (faceId: string) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()

      const coords = worldToFaceCoords(faceId, e.point)
      if (!coords) return

      pointerDownRef.current = {
        clientX: e.nativeEvent.clientX,
        clientY: e.nativeEvent.clientY,
        time: e.nativeEvent.timeStamp,
        faceId,
        ...coords,
      }

      const mode = useWallStore.getState().editorMode
      if (mode === 'blade' || mode === 'trim') {
        useWallStore.getState().beginSeam(mode, faceId, [coords.u, coords.v])
        setupDragPlane(faceId)
        drawingOnFaceRef.current = faceId
        isDraggingRef.current = true
        document.body.style.cursor = 'crosshair'
      }
    },
    [worldToFaceCoords, setupDragPlane],
  )

  /* A face is clickable, so it says so; holds set their own cursor and stop
     the event before it reaches here */
  const handleFacePointerEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isDraggingRef.current) document.body.style.cursor = 'pointer'
  }, [])

  const handleFacePointerLeave = useCallback(() => {
    if (!isDraggingRef.current) document.body.style.cursor = 'default'
  }, [])

  /* Hold pointer down — select + start drag, save pre-drag position */
  const handleHoldPointerDown = useCallback((holdId: string) => (e: ThreeEvent<PointerEvent>) => {
    /* While shaping or cutting panels a hold is scenery: let the press fall
       through to the panel underneath rather than grabbing something the mode
       picker says is not what clicks are for */
    if (useWallStore.getState().editorMode !== 'holds') return

    e.stopPropagation()
    useWallStore.getState().selectHold(holdId)

    const hold = useWallStore.getState().wall.holds.find((h) => h.id === holdId)
    if (!hold) return

    draggingHoldIdRef.current = holdId
    isDraggingRef.current = true
    setupDragPlane(hold.faceId)
    document.body.style.cursor = 'grabbing'
  }, [setupDragPlane])

  return {
    registerFaceMesh,
    isDragging: isDraggingRef,
    handleFacePointerDown,
    handleFacePointerEnter,
    handleFacePointerLeave,
    handleHoldPointerDown,
  }
}

function isTap(down: PointerDown, up: PointerEvent): boolean {
  const distance = Math.hypot(up.clientX - down.clientX, up.clientY - down.clientY)
  return distance < TAP_SLOP_PX && up.timeStamp - down.time < TAP_MS
}

function resolveTap(down: PointerDown) {
  const { editorMode, selectedHoldId, selectHold, selectFace, addHold } = useWallStore.getState()

  const action = resolveWallTap({ mode: editorMode, selectedHoldId, hitFaceId: down.faceId })

  if (action === 'deselectHold') selectHold(null)
  else if (action === 'selectFace') selectFace(down.faceId)
  else addHold(down.faceId, down.u, down.v)
}
