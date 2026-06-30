import { createContext, isPromise } from './utils.js';
import { mergeCore } from './core/merge-core.js';
import { err, handleMergeError } from './errors.js';
import { loadSpecs, loadSpecsAsync } from './load.js';
import type { InputSource, MergeContext, MergeOptions, MergeResult } from './types.js';

function runMerge(
  inputs: InputSource[],
  options: MergeOptions | undefined,
  loader: (inputs: InputSource[], ctx: MergeContext) => void | Promise<void>,
): MergeResult | Promise<MergeResult> {
  try {
    if (inputs.length === 0) {
      return err('no-inputs', 'You must provide at least one input entity');
    }

    const ctx = createContext();
    const result = loader(inputs, ctx);

    if (isPromise(result)) {
      return result
        .then(() => mergeCore(ctx, options))
        .catch((error) => handleMergeError(error));
    }

    return mergeCore(ctx, options);
  } catch (error) {
    return handleMergeError(error);
  }
}

export async function mergeAsync(
  inputs: InputSource[],
  options?: MergeOptions,
): Promise<MergeResult> {
  return await runMerge(inputs, options, loadSpecsAsync);
}

export function merge(
  inputs: InputSource[],
  options?: MergeOptions,
): MergeResult {
  return runMerge(inputs, options, loadSpecs) as MergeResult;
}
