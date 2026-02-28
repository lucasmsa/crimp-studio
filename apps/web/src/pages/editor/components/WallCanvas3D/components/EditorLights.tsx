import { colors } from '@/lib/colors'

export function EditorLights() {
  return (
    <>
      {/* Base ambient fill - enough to see everything */}
      <ambientLight intensity={0.5} />

      {/* Key light from top-front-right — primary illumination */}
      <directionalLight
        position={[3, 5, 5]}
        intensity={1.2}
        color={colors.light.surface}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Fill from the left to soften shadows */}
      <pointLight position={[-4, 2, 3]} intensity={0.3} color={colors.light.surface} />

      {/* Warm accent from below — subtle, gives life to wall texture */}
      <pointLight position={[0, -2, 4]} intensity={0.15} color={colors.primary} />
    </>
  )
}
