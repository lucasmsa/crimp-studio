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
  /** Cel band luminances, dark to light. The floor sits high because the panels
      are painted white now: on a low ramp the lit face of a white wall lands in
      the middle band and reads grey, which is not what a gym looks like */
  gradientSteps: [165, 215, 255],
} as const
