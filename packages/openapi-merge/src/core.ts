import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';
import { validate } from './validate.js';
import { MergeContext, MergeOptions, MergeResult } from './types';

const EMPTY_OUTPUT: OpenApiV3_0 = {
  openapi: '3.0.4',
  info: {
    title: '',
    version: '0.0.0',
  },
  paths: {},
};

const DEFAULT_VERSION_POLICY: MergeOptions['versionPolicy'] = {
  mode: 'strict',
  targetVersion: '3.0',
};

export function mergeCore(ctx: MergeContext, options?: MergeOptions): MergeResult {
  const versionPolicy = options?.versionPolicy ?? DEFAULT_VERSION_POLICY;
  validate(ctx.rawSpecs, { versionPolicy });

  return { ok: true, output: EMPTY_OUTPUT };
}
