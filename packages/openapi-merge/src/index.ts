import { mergeCore } from './core';
import { err } from './errors';
import { loadSpecs } from './load';
import type { InputSource, MergeContext, MergeOptions, MergeResult } from './types';

export async function mergeAsync(
  inputs: InputSource[],
  options?: MergeOptions
): Promise<MergeResult> {
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
}

export function merge(inputs: InputSource[], options?: MergeOptions): MergeResult {
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
}
