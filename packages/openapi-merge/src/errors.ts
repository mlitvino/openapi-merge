import type { MergeError, MergeResult } from './types';

export class MergeException extends Error {
  constructor(public readonly error: MergeError) {
    super(error.message);
    this.name = 'MergeException';
  }
}

export function err(type: MergeError['type'], message: string): MergeResult {
  return { ok: false, error: { type, message } };
}

export function throwMergeError(type: MergeError['type'], message: string): never {
  throw new MergeException({ type, message });
}
