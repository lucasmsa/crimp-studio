import { useMemo } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import { colors } from '@/lib/colors'
import { applyToonMaterials } from '@/lib/three/toon'

/**
 * 3D Climbing Shoe Component
 *
 * Temporary model:
 * - Source: https://sketchfab.com/3d-models/climbing-shoe-scan-lowpoly-cb2cedcb90cd48999632e4aa33488262
 * - Author: EFX (https://sketchfab.com/evan4129)
 * - License: CC Attribution - credited on About page
 *
 * Future: Replace with photogrammetry scan of personal climbing shoe
 */

export function ClimbingShoe() {
  const { scene } = useGLTF('/models/climbing-shoe.glb')

  /* Cel-shade the scan (ADR-005): toon bands over the original texture,
     ink outline hull like the editor holds. Idempotent on drei's cached scene. */
  useMemo(
    () => applyToonMaterials(scene, { outlineColor: colors.scene.outline, outlineThickness: 0.004 }),
    [scene],
  )

  return (
    <Center>
      <primitive object={scene} scale={2} />
    </Center>
  )
}

useGLTF.preload('/models/climbing-shoe.glb')
