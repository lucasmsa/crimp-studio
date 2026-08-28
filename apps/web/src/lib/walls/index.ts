import { browserWallStorage } from './browserWallStorage'

export type {
  ParseFailure,
  ParseResult,
  SavedHold,
  WallDocument,
  WallSummary,
} from './document'
export {
  WALL_DOCUMENT_VERSION,
  fromDocument,
  parseDocument,
  signatureOf,
  summarise,
  toDocument,
} from './document'

export type { ReadResult, WallStorage, WriteFailure, WriteResult } from './storage'
export { browserWallStorage } from './browserWallStorage'

/** The store the app uses. Swapping this line is what points walls at a server */
export const wallStorage = browserWallStorage()
