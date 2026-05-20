import type { MergeError, MergeResult } from './types';

export function err(type: MergeError['type'], message: string): MergeResult {
  return { ok: false, error: { type, message } };
}
