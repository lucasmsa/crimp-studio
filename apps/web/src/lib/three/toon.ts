import * as THREE from 'three'
import { createOutlineGeometry } from './outline'

/** Default cel band luminances, dark to light (matches the editor's toon look) */
export const DEFAULT_TOON_STEPS: readonly number[] = [120, 185, 255]

const gradientCache = new Map<string, THREE.DataTexture>()

/**
 * Gradient map for MeshToonMaterial: hard luminance bands sampled with
 * nearest filtering. Cached per band set, shared across materials.
 */
export function getToonGradientMap(steps: readonly number[] = DEFAULT_TOON_STEPS): THREE.DataTexture {
  const key = steps.join(',')
  const cached = gradientCache.get(key)
  if (cached) return cached

  const data = Uint8Array.from(steps)
  const texture = new THREE.DataTexture(data, steps.length, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  gradientCache.set(key, texture)
  return texture
}

export interface ToonifyOptions {
  /** Ink color for the inverted-hull outline; omit for no outline */
  outlineColor?: string
  /** Stroke thickness in the mesh's local units */
  outlineThickness?: number
  steps?: readonly number[]
}

/**
 * Swaps every mesh material under root for MeshToonMaterial, keeping the
 * original diffuse map and color, and optionally adds an inverted-hull
 * outline per mesh. Idempotent: already-toonified meshes are skipped, so
 * it is safe on drei's cached GLTF scenes and across re-renders.
 */
export function applyToonMaterials(root: THREE.Object3D, options: ToonifyOptions = {}): void {
  const { outlineColor, outlineThickness = 0.005, steps } = options

  /* Collect first: adding hull children during traverse() would visit them */
  const meshes: THREE.Mesh[] = []
  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh && !mesh.userData.toonified && !mesh.userData.isOutlineHull) {
      meshes.push(mesh)
    }
  })

  for (const mesh of meshes) {
    const source = mesh.material as THREE.MeshStandardMaterial
    mesh.material = new THREE.MeshToonMaterial({
      map: source.map ?? null,
      color: source.color?.clone() ?? new THREE.Color('#ffffff'),
      gradientMap: getToonGradientMap(steps),
    })
    mesh.userData.toonified = true

    if (outlineColor) {
      const hull = new THREE.Mesh(
        createOutlineGeometry(mesh.geometry, outlineThickness),
        new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.BackSide }),
      )
      hull.userData.isOutlineHull = true
      mesh.add(hull)
    }
  }
}
