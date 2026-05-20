import { mergeCore } from './core';
import { MergeException, err } from './errors';
import { loadSpecs, loadSpecsAsync } from './load';
import type { InputSource, MergeContext, MergeOptions, MergeResult } from './types';

export async function mergeAsync(
  inputs: InputSource[],
  options?: MergeOptions
): Promise<MergeResult> {
  try {
    if (inputs.length === 0) {
      return err('no-inputs', 'You must provide at least one input entity');
    }

    const ctx: MergeContext = {
      rawSpecs: [],
      parsedSpecs: [],
    };

    await loadSpecsAsync(inputs, ctx);

    const res = mergeCore(ctx, options);

    return res;
  } catch (error) {
    if (error instanceof MergeException) {
      return { ok: false, error: error.error };
    }

    return err('internal-error', 'Unexpected error.');
  }
}

export function merge(inputs: InputSource[], options?: MergeOptions): MergeResult {
  try {
    if (inputs.length === 0) {
      return err('no-inputs', 'You must provide at least one input entity');
    }

    const ctx: MergeContext = {
      rawSpecs: [],
      parsedSpecs: [],
    };

    loadSpecs(inputs, ctx);

    const res = mergeCore(ctx, options);

    return res;
  } catch (error) {
    if (error instanceof MergeException) {
      return { ok: false, error: error.error };
    }

    return err('internal-error', 'Unexpected error.');
  }
}
