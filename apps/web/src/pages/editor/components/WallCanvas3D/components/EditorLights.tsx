import { colors } from '@/lib/colors'
import { SCENE_STYLE } from '../config/sceneStyleConfig'

/**
 * Toon rig: one hard key + flat ambient. The cel bands come from the
 * gradient map, so fill lights would only wash the steps out.
 */
function ToonLights() {
  return (
    <>
      {/* Low ambient: the key light must dominate or the cel bands wash out */}
      <ambientLight intensity={0.45} />

      {/* Hard key, mostly frontal: a steep overhead angle rakes long detached
         shadows across the wall; frontal keeps them tight to the hold base */}
      <directionalLight
        position={[5, 7, 10]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-bias={-0.0002}
        shadow-normalBias={0.008}
      />
    </>
  )
}

/**
 * Standard rig: three-point setup. Key with soft shadows, cool slate rim
 * for edge separation, warm low fill so the wall does not read flat.
 */
function StandardLights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={[colors.light.surface, colors.dark.border, 0.35]} />

      <directionalLight
        position={[4, 12, 8]}
        intensity={1.3}
        color={colors.light.surface}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-radius={3}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-bias={-0.0002}
        shadow-normalBias={0.008}
      />

      {/* Cool rim from behind-left separates holds from the wall */}
      <directionalLight position={[-6, 4, -3]} intensity={0.5} color={colors.secondary} />

      {/* Fill from the left to soften shadows */}
      <pointLight position={[-4, 2, 3]} intensity={0.3} color={colors.light.surface} />

      {/* Warm accent from below, gives life to wall texture */}
      <pointLight position={[0, -2, 4]} intensity={0.15} color={colors.wall.warmLight} />
    </>
  )
}

export function EditorLights() {
  return SCENE_STYLE === 'toon' ? <ToonLights /> : <StandardLights />
}
