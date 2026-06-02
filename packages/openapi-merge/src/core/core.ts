import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';
import { validate } from '../validate.js';
import { MergeContext, MergeOptions, MergeResult } from '../types.js';
import { mergePaths, mergeComponents } from './merge-utils.js';

const DEFAULT_VERSION_POLICY: MergeOptions['versionPolicy'] = {
  mode: 'skip',
};

export function mergeCore(ctx: MergeContext, options?: MergeOptions): MergeResult {
  const versionPolicy = options?.versionPolicy ?? DEFAULT_VERSION_POLICY;

  validate(ctx, { versionPolicy });

  const specs: OpenApiV3_0[] = ctx.parsedSpecs;

  if (specs.length === 0) {
    return {
      ok: false,
      error: { type: 'no-inputs', message: 'No valid OpenAPI 3.0 documents found' },
    };
  }

  const base: OpenApiV3_0 = structuredClone(specs[0]);

  base.components = structuredClone(base.components ?? {});
  base.paths = structuredClone(base.paths ?? {});

  let mergedPaths = base.paths;
  let mergedComponents = base.components ?? {};

  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];

    mergedPaths = mergePaths(mergedPaths, spec.paths ?? {});
    mergedComponents = mergeComponents(mergedComponents, spec.components ?? {});

    if (spec.info) {
      base.info = structuredClone(spec.info);
    }
    if (spec.servers) {
      base.servers = structuredClone(spec.servers);
    }
    if (spec.security) {
      base.security = structuredClone(spec.security);
    }
    if (spec.tags) {
      base.tags = structuredClone(spec.tags);
    }
    if (spec.externalDocs) {
      base.externalDocs = structuredClone(spec.externalDocs);
    }
  }

  base.paths = mergedPaths;
  base.components = mergedComponents;

  return { ok: true, output: base };
}
