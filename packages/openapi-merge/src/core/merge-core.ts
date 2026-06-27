import type { Document as OpenApiV3_0, PathsObject } from '@scalar/openapi-types/3.0';
import { validate } from '../validate.js';
import {
  MergeContext,
  MergeOptions,
  MergeResult,
  ResolvedMergeOptions,
  validateOptions,
} from '../types.js';
import { filterByPaths, filterByTags } from './filter.js';
import { mergeComponents, mergePaths, validateOperationIds } from './merge-paths.js';
import { renamePaths } from './rename-paths.js';

export function mergeCore(ctx: MergeContext, inputOptions?: MergeOptions): MergeResult {
  const options = validateOptions(inputOptions);

  validate(ctx, options);

  const specs = ctx.parsedSpecs;

  if (specs.length === 0) {
    return {
      ok: false,
      error: { type: 'no-inputs', message: 'No valid OpenAPI 3.0 documents found' },
    };
  }

  const base: OpenApiV3_0 = structuredClone(specs[0]);
  base.paths ??= {};
  base.components ??= {};

  let mergedPaths = applyPathTransforms(base.paths, options);
  let mergedComponents = base.components;

  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];

    mergedPaths = mergePaths(
      mergedPaths,
      applyPathTransforms(spec.paths ?? {}, options),
      options.pathPolicy,
    );
    mergedComponents = mergeComponents(
      mergedComponents,
      spec.components ?? {},
      options.componentPolicy,
    );

    mergeTopLevelFields(base, spec);
  }

  base.paths = mergedPaths;
  base.components = mergedComponents;

  validateOperationIds(base.paths, options.operationIdPolicy);

  return { ok: true, output: base };
}

function applyPathTransforms(paths: PathsObject, options: ResolvedMergeOptions): PathsObject {
  const tagSelected = filterByTags(paths, options.tagFilter);
  const filteredPaths = filterByPaths(tagSelected, options.pathFilter);
  return renamePaths(filteredPaths, options.pathRename);
}

function mergeTopLevelFields(
  base: OpenApiV3_0,
  spec: OpenApiV3_0,
): void {
  if (base.info == null && spec.info != null) {
    base.info = structuredClone(spec.info);
  }
  if (base.servers == null && spec.servers != null) {
    base.servers = structuredClone(spec.servers);
  }
  if (base.security == null && spec.security != null) {
    base.security = structuredClone(spec.security);
  }
  if (base.tags == null && spec.tags != null) {
    base.tags = structuredClone(spec.tags);
  }
  if (base.externalDocs == null && spec.externalDocs != null) {
    base.externalDocs = structuredClone(spec.externalDocs);
  }
}
