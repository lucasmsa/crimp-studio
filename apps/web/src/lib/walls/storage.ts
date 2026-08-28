import type { ParseFailure, WallDocument } from './document'

/**
 * Where saved walls live.
 *
 * Async on purpose, though the browser's own storage is not: this is the seam a
 * real database goes behind, and a synchronous interface would have to be torn
 * up to put one there (ADR-009).
 */
export interface WallStorage {
  /**
   * Every saved wall, newest first. Whole documents rather than a digest: the
   * library draws each wall's profile, so the geometry is what a row is made of
   */
  list(): Promise<WallDocument[]>
  read(id: string): Promise<ReadResult>
  write(document: WallDocument): Promise<WriteResult>
  remove(id: string): Promise<void>

  /** The wall being worked on, written continuously and restored on the next visit */
  readCurrent(): Promise<ReadResult>
  writeCurrent(document: WallDocument): Promise<WriteResult>
}

export type ReadResult =
  | { ok: true; document: WallDocument }
  | { ok: false; reason: ParseFailure | 'missing' }

export type WriteResult = { ok: true } | { ok: false; reason: WriteFailure }

/** `full` is the storage quota, which is the one failure a browser store really has */
export type WriteFailure = 'full' | 'unavailable'
