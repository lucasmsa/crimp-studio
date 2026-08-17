import { colors } from '@/lib/colors'
import { SCENE_STYLE } from '../config/sceneStyleConfig'

/**
 * Toon rig: one hard key + flat ambient. The cel bands come from the
 * gradient map, so fill lights would only wash the steps out.
 */
function ToonLights() {
  return (
    <>
      {/* Enough fill that a shadowed panel still reads as plywood rather than a
         hole in the wall, but not so much that the cel bands wash out */}
      <ambientLight intensity={0.62} />

      {/* Hard key from above-right, raked well off the wall normal. A hold's
         shadow lands (x/z, y/z) per unit of its height, so a frontal key parks
         each shadow under its own hold: flat holds showed nothing, and sloped
         volumes (pyramids, whose sides lean inward) nothing at all since their
         projected apex stays inside the base. y/z must clear ~2 for those to
         read. normalBias stays small for the same reason: 8mm of normal offset
         erased the contact shadow on every flat hold.
         Frustum and map size are a pair: they set the texel size, and texels
         are what a hold's shadow edge is drawn with. Too wide a frustum and a
         10cm hold gets a staircase for an outline and speckles itself with
         acne; too narrow and a bent panel's shadow is clipped off mid-wall. */}
      <directionalLight
        position={[8, 12, 5]}
        intensity={2.0}
        shadow-intensity={0.72}
        castShadow
        shadow-mapSize-width={8192}
        shadow-mapSize-height={8192}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.1}
        shadow-camera-far={24}
        shadow-bias={-0.0003}
        shadow-normalBias={0.006}
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
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
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
