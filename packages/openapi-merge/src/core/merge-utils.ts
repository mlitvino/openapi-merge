import type { PathsObject, ComponentsObject } from '@scalar/openapi-types/3.0';
import { throwMergeError } from '../errors.js';

export type ComponentsMap = Record<string, Record<string, unknown>>;

export function mergePaths(
  basePaths: PathsObject,
  specPaths: PathsObject
): PathsObject {
  const mergedPaths = structuredClone(basePaths);

  for (const [pathKey, pathItem] of Object.entries(specPaths)) {
    if (pathKey in mergedPaths) {
      const baseItem = mergedPaths[pathKey] as Record<string, unknown>;
      const incomingItem = pathItem as Record<string, unknown>;

      for (const [method, operation] of Object.entries(incomingItem)) {
        if (typeof method === 'string' && method in baseItem) {
          throwMergeError(
            'duplicate-path',
            `Conflicting path: ${pathKey} method ${method}`
          );
        }

        baseItem[method] = structuredClone(operation);
      }
    } else {
      mergedPaths[pathKey] = structuredClone(pathItem);
    }
  }

  return mergedPaths;
}

export function mergeComponents(
  baseComponents: ComponentsObject,
  incomingComponents: ComponentsObject
): ComponentsMap {
  const mergedComponents = structuredClone(baseComponents) as ComponentsMap;

  for (const [compKey, compMap] of Object.entries(incomingComponents)) {
    if (!compMap || typeof compMap !== 'object') continue;
    if (!mergedComponents[compKey]) {
      mergedComponents[compKey] = {};
    }

    const target = mergedComponents[compKey];
    for (const [name, obj] of Object.entries(compMap)) {
      if (name in target) {
        let attempt = 2;
        let candidate = `${name}_v${attempt}`;

        while (candidate in target) {
          attempt += 1;
          candidate = `${name}_v${attempt}`;
        }

        target[candidate] = structuredClone(obj);
      } else {
        target[name] = structuredClone(obj);
      }
    }
  }

  return mergedComponents;
}
