import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';
import { validate } from '../validate.js';
import { MergeContext, MergeOptions, MergeResult } from '../types.js';

const EMPTY_OUTPUT: OpenApiV3_0 = {
  openapi: '0',
  info: {
    title: '',
    version: '0',
  },
  paths: {},
};

const DEFAULT_VERSION_POLICY: MergeOptions['versionPolicy'] = {
  mode: 'skip',
};

export function mergeCore(ctx: MergeContext, options?: MergeOptions): MergeResult {
  const versionPolicy = options?.versionPolicy ?? DEFAULT_VERSION_POLICY;
  validate(ctx, { versionPolicy });

  const parsedSpecs: OpenApiV3_0[] = ctx.parsedSpecs;
  void parsedSpecs;

  console.log('PARSED', ctx.parsedSpecs);

  return { ok: true, output: EMPTY_OUTPUT };
}
