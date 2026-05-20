import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';
import { MergeContext, MergeResult } from './types';

const EMPTY_OUTPUT: OpenApiV3_0 = {
  openapi: '3.0.4',
  info: {
    title: '',
    version: '0.0.0',
  },
  paths: {},
};

export function mergeCore(ctx: MergeContext): MergeResult {
  return { ok: true, output: EMPTY_OUTPUT };
}
