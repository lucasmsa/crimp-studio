import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { Hold } from '@/stores/wallStore'
import type { HoldModelVariant } from '../config/holdModelConfig.generated'
import { createHoldGeometry } from '../utils/holdGeometry'
import { holdGeometryConfigs } from '../config/holdGeometryConfig'
import { getModelScaleFactor } from '../utils/holdModels'
import { CM_TO_M } from '../constants/editor3d'

export function useProceduralHoldGeometry(hold: Hold): THREE.BufferGeometry {
  const holdScale = hold.size * CM_TO_M * holdGeometryConfigs[hold.type].sizeMultiplier

  return useMemo(() => createHoldGeometry(hold.type, holdScale), [hold.type, holdScale])
}

function findMeshGeometry(scene: THREE.Group): THREE.BufferGeometry | null {
  let geometry: THREE.BufferGeometry | null = null
  scene.traverse((child) => {
    if (!geometry && (child as THREE.Mesh).isMesh) {
      geometry = (child as THREE.Mesh).geometry
    }
  })
  return geometry
}

/**
 * Loads a hold's GLB model (suspends while fetching) and returns its geometry
 * scaled to the hold's target on-wall footprint. Scale is baked into the
 * geometry so downstream measurement (collision box, hit area) needs no
 * knowledge of the model.
 */
export function useModelHoldGeometry(hold: Hold, model: HoldModelVariant): THREE.BufferGeometry {
  const { scene } = useGLTF(model.path)
  const scaleFactor = getModelScaleFactor(model, hold.type, hold.size)

  return useMemo(() => {
    const source = findMeshGeometry(scene)
    if (!source) {
      throw new Error(`No mesh geometry found in ${model.path}`)
    }
    const geometry = source.clone()
    geometry.scale(scaleFactor, scaleFactor, scaleFactor)
    return geometry
  }, [scene, scaleFactor, model.path])
}
