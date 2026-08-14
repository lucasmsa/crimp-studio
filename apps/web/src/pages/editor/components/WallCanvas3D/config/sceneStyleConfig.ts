/**
 * Scene render style spike (ADR-005 follow-up, 2026-08-12).
 * 'toon' = No More Heroes-style cel shading with ink outlines.
 * 'standard' = PBR materials with a soft three-point rig.
 * Rollback is this one line.
 */
export type SceneStyle = 'toon' | 'standard'

export const SCENE_STYLE: SceneStyle = 'toon'

export const toonConfig = {
  /** Ink stroke thickness in world units (meters), baked along smoothed normals */
  holdOutline: 0.009,
  /** Wall outline rim in world units (meters); corner-normal displacement
      lands at ~0.58x of this per axis, so it runs thicker than hold strokes */
  wallOutline: 0.05,
  /** Cel band luminances, dark to light. Three hard bands with wide separation:
      with four close bands + high ambient the steps washed out at many angles */
  gradientSteps: [95, 170, 255],
} as const
