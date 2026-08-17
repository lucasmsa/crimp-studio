import { Suspense } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { Hold } from '@/stores/wallStore'
import type { HoldModelVariant } from '../config/holdModelConfig.generated'
import { FLAT_SHADED_TYPES } from '../utils/holdGeometry'
import { getAllModelPaths, getModelVariant } from '../utils/holdModels'
import { useModelHoldGeometry, useProceduralHoldGeometry } from '../hooks/useHoldGeometry'
import { HoldMesh } from './HoldMesh'

/* Preload every hold model when the editor bundle loads (~2 MB total), so
   placement never falls back to procedural geometry mid-session. */
getAllModelPaths().forEach((path) => useGLTF.preload(path))

interface Hold3DProps {
  hold: Hold
  isSelected: boolean
  /** Its panel is not the focused one, so the hold steps back with it */
  isDimmed?: boolean
  isColliding?: boolean
  isDeleting?: boolean
  isDraggingAny: React.RefObject<boolean>
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
}

/**
 * Renders a hold as its GLB model when the hold has one (see tools/holds/).
 * Models are preloaded at module load, so the Suspense gap is only hit on a
 * cold cache; nothing renders during it (the procedural flash read as a bug).
 * Holds without a model variant (volume) render procedurally.
 */
export function Hold3D(props: Hold3DProps) {
  const model = getModelVariant(props.hold.type, props.hold.variant)

  if (!model) return <ProceduralHold3D {...props} />

  return (
    <Suspense fallback={null}>
      <ModelHold3D {...props} model={model} />
    </Suspense>
  )
}

function ProceduralHold3D(props: Hold3DProps) {
  const geometry = useProceduralHoldGeometry(props.hold)

  return (
    <HoldMesh {...props} geometry={geometry} flatShading={FLAT_SHADED_TYPES.has(props.hold.type)} />
  )
}

function ModelHold3D({ model, ...props }: Hold3DProps & { model: HoldModelVariant }) {
  const geometry = useModelHoldGeometry(props.hold, model)

  return <HoldMesh {...props} geometry={geometry} flatShading={false} />
}
