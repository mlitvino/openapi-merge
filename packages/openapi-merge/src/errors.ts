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

export function throwError(type: MergeError['type'], message: string): never {
  throw new MergeException({ type, message });
}

export function handleMergeError(error: unknown): MergeResult {
  if (error instanceof MergeException) {
    return { ok: false, error: error.error };
  }

  return err('internal-error', 'Unexpected error.');
}
