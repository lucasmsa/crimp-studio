import { colors } from '@/lib/colors'

export function EditorLights() {
  return (
    <>
      {/* Base ambient fill - enough to see everything */}
      <ambientLight intensity={0.5} />

      {/* Key light — mostly frontal with slight top-right offset.
         More perpendicular angle keeps shadows tight against hold bases. */}
      <directionalLight
        position={[4, 12, 8]}
        intensity={1.2}
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
        shadow-bias={0.0004}
      />

      {/* Fill from the left to soften shadows */}
      <pointLight position={[-4, 2, 3]} intensity={0.3} color={colors.light.surface} />

      {/* Warm accent from below — subtle, gives life to wall texture */}
      <pointLight position={[0, -2, 4]} intensity={0.15} color={colors.primary} />
    </>
  )
}
