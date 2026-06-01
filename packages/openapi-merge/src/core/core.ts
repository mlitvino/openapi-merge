import type { Document as OpenApiV3_0, PathsObject } from '@scalar/openapi-types/3.0';
import { validate } from '../validate.js';
import { MergeContext, MergeOptions, MergeResult } from '../types.js';

export type ComponentsMap = Record<string, Record<string, unknown>>;

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

  const mergedComponents = (base.components ?? {}) as ComponentsMap;
  const mergedPaths: Record<string, unknown> = structuredClone(base.paths ?? {});

  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];

    const incomingPaths: Record<string, unknown> = spec.paths ?? {};
    for (const [pathKey, pathItem] of Object.entries(incomingPaths)) {
      if (pathKey in mergedPaths) {
        const baseItem = mergedPaths[pathKey] as Record<string, unknown>;
        const incomingItem = pathItem as Record<string, unknown>;

        for (const [method, operation] of Object.entries(incomingItem)) {
          if (typeof method === 'string' && method in baseItem) {
            return {
              ok: false,
              error: {
                type: 'duplicate-path',
                message: `Conflicting path: ${pathKey} method ${method}`,
              },
            };
          }
          baseItem[method] = structuredClone(operation);
        }
      } else {
        mergedPaths[pathKey] = structuredClone(pathItem);
      }
    }

    const incomingComponents = (spec.components ?? {}) as ComponentsMap;
    for (const [compKey, compMap] of Object.entries(incomingComponents)) {
      if (!compMap || typeof compMap !== 'object') continue;
      if (!mergedComponents[compKey]) {
        mergedComponents[compKey] = {};
      }
      for (const [name, obj] of Object.entries(compMap)) {
        if (name in (mergedComponents[compKey] || {})) {
          let attempt = 2;
          let candidate = `${name}_v${attempt}`;
          const target = mergedComponents[compKey];
          while (candidate in target) {
            attempt++;
            candidate = `${name}_v${attempt}`;
          }
          target[candidate] = structuredClone(obj);
        } else {
          mergedComponents[compKey][name] = structuredClone(obj);
        }
      }
    }

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

  base.paths = mergedPaths as PathsObject;
  base.components = mergedComponents;

  return { ok: true, output: base };
}
