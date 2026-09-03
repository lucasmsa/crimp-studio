import type { EditorMode } from '@/stores/wallStore'

export interface EditorTool {
  mode: EditorMode
  /** Path data for a 24x24 stroked icon */
  icon: string
}

/**
 * What a click on the wall is for. Placing holds, shaping panels and cutting
 * them land on the same pixels, so the rail says which one is armed rather
 * than guessing from click order. Blade and trim both draw a seam; blade hinges
 * the far piece on it, trim throws the far piece away (ADR-011).
 */
export const EDITOR_TOOLS: EditorTool[] = [
  { mode: 'holds', icon: 'M7 8h.01M12 12h.01M17 7h.01M8 16h.01M16 16h.01' },
  { mode: 'shape', icon: 'M4 20h6l4-6 6-9' },
  { mode: 'blade', icon: 'M5 19L19 5M15 5h4v4' },
  { mode: 'trim', icon: 'M5 19L19 5M4 4h6v6M12 20l7-7' },
]
