import type { ComponentsObject, PathsObject } from '@scalar/openapi-types/3.0';
import { throwError } from '../errors.js';
import type {
  ComponentPolicy,
  MethodConflictMode,
  OperationIdPolicy,
  PathPolicy,
} from '../types.js';
import { HTTP_METHODS } from '../utils.js';

export type ComponentsMap = Record<string, Record<string, unknown>>;

export function mergePaths(
  basePaths: PathsObject,
  specPaths: PathsObject,
  policy: PathPolicy,
): PathsObject {
  const mergedPaths = structuredClone(basePaths);

  for (const [pathKey, pathItem] of Object.entries(specPaths)) {
    if (pathKey in mergedPaths) {
      resolvePathConflict(policy, pathKey, mergedPaths[pathKey], pathItem);
    } else {
      mergedPaths[pathKey] = structuredClone(pathItem);
    }
  }

  return mergedPaths;
}

function mergePathItem(
  baseItem: Record<string, unknown>,
  incomingItem: Record<string, unknown>,
  pathKey: string,
  onMethodConflict: MethodConflictMode = 'error',
): void {
  for (const [key, value] of Object.entries(incomingItem)) {
    if ((HTTP_METHODS as readonly string[]).includes(key)) {
      if (key in baseItem) {
        resolveMethodConflict(baseItem, key, value, pathKey, onMethodConflict);
      } else {
        baseItem[key] = structuredClone(value);
      }
    } else if (!(key in baseItem)) {
      baseItem[key] = structuredClone(value);
    }
  }
}

function resolveMethodConflict(
  baseItem: Record<string, unknown>,
  method: string,
  incoming: unknown,
  pathKey: string,
  mode: MethodConflictMode,
): void {
  if (mode === 'error') {
    throwError('duplicate-method', `Duplicate method ${method} on path: ${pathKey}`);
  } else if (mode === 'last-wins') {
    baseItem[method] = structuredClone(incoming);
  } else if (mode === 'first-wins') {
    // keep base, do nothing
  }
}

function resolvePathConflict(
  policy: PathPolicy,
  pathKey: string,
  baseItem: Record<string, unknown>,
  incomingItem: Record<string, unknown>,
): void {
  if (policy.mode === 'error') {
    throwError('duplicate-path', `Duplicate path: ${pathKey}`);
  }
  if (policy.mode === 'merge') {
    mergePathItem(baseItem, incomingItem, pathKey, policy.onMethodConflict);
  }
}

export function mergeComponents(
  baseComponents: ComponentsObject,
  specComponents: ComponentsObject,
  policy: ComponentPolicy,
): ComponentsMap {
  const mergedComponents = structuredClone(baseComponents) as ComponentsMap;

  for (const [compKey, compMap] of Object.entries(specComponents)) {
    if (!compMap || typeof compMap !== 'object') continue;
    if (!mergedComponents[compKey]) {
      mergedComponents[compKey] = {};
    }

    const target = mergedComponents[compKey];
    for (const [name, obj] of Object.entries(compMap)) {
      if (name in target) {
        switch (policy.mode) {
          case 'first-wins':
            break;
          case 'error':
            throwError('duplicate-component', `Duplicate component: ${compKey} ${name}`);
        }
      } else {
        target[name] = structuredClone(obj);
      }
    }
  }

  return mergedComponents;
}

export function validateOperationIds(paths: PathsObject, policy: OperationIdPolicy): void {
  const seen = new Set<string>();

  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    const item = pathItem as Record<string, unknown>;

    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation || typeof operation !== 'object') continue;

      const operationId = (operation as Record<string, unknown>).operationId;
      if (typeof operationId !== 'string') continue;

      if (seen.has(operationId)) {
        makeOperationIdConflictHandler(policy, operationId)();
      } else {
        seen.add(operationId);
      }
    }
  }
}

function makeOperationIdConflictHandler(
  policy: OperationIdPolicy,
  operationId: string,
): () => void {
  switch (policy.mode) {
    case 'error':
      return () => {
        throwError('duplicate-operationid', `Duplicate operationId: ${operationId}`);
      };
  }
}
