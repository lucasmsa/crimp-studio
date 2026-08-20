/** Scale factor: the wall is authored in centimetres and rendered in metres */
export const CM_TO_M = 0.01

/** Plywood thickness in metres. A panel is a real slab, not a plane */
export const WALL_DEPTH = 0.08

/** How far a hold sinks into the panel it is bolted to, in metres. Just enough
    to stop z-fighting; deeper visibly buries a hold at glancing view angles */
export const HOLD_EMBED_DEPTH = 0.002
