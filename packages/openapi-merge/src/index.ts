import { mergeCore } from './core';
import { err } from './errors';
import { loadSpecs } from './load';
import type { InputSource, MergeContext, MergeResult } from './types';

export async function mergeAsync(inputs: InputSource[]): Promise<MergeResult> {
  if (inputs.length === 0) {
    return err('no-inputs', 'You must provide at least one input entity');
  }

  const ctx: MergeContext = {
    rawSpecs: [],
    parsedSpecs: [],
  };

  loadSpecs(inputs, ctx);

  const res = mergeCore(ctx);

  return res;
}

export function merge(inputs: InputSource[]): MergeResult {
  if (inputs.length === 0) {
    return err('no-inputs', 'You must provide at least one input entity');
  }

  const ctx: MergeContext = {
    rawSpecs: [],
    parsedSpecs: [],
  };

  loadSpecs(inputs, ctx);

  const res = mergeCore(ctx);

  return res;
}
