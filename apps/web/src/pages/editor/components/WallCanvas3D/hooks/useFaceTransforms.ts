import { useMemo } from 'react'
import type { FaceTree } from '../utils/faceTree'
import type { FaceTransforms } from '../utils/faceTransform'
import { computeFaceTransforms } from '../utils/faceTransform'

export function useFaceTransforms(faces: FaceTree): FaceTransforms {
  return useMemo(() => computeFaceTransforms(faces), [faces])
}
