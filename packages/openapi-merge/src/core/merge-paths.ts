import type { ComponentsObject, PathsObject } from '@scalar/openapi-types/3.0';
import { throwError } from '../errors.js';
import type { ComponentPolicy, OperationIdPolicy, PathPolicy } from '../types.js';
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
      makePathConflictHandler(policy, pathKey)();
    } else {
      mergedPaths[pathKey] = structuredClone(pathItem);
    }
  }

  return mergedPaths;
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
      setEntry(target, name, obj, makeComponentConflictHandler(policy, compKey, name));
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

function setEntry(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  onConflict: () => void,
): void {
  if (key in target) {
    onConflict();
    return;
  }
  target[key] = structuredClone(value);
}

function makeOperationIdConflictHandler(
  policy: OperationIdPolicy,
  operationId: string
): () => void {
  switch (policy.mode) {
    case 'error':
      return () => {
        throwError('duplicate-operationid', `Duplicate operationId: ${operationId}`);
      };
  }
}

function makePathConflictHandler(policy: PathPolicy, pathKey: string): () => void {
  switch (policy.mode) {
    case 'error':
      return () => {
        throwError('duplicate-path', `Duplicate path: ${pathKey}`);
      };
  }
}

function makeComponentConflictHandler(
  policy: ComponentPolicy,
  compKey: string,
  name: string,
): () => void {
  switch (policy.mode) {
    case 'error':
      return () => {
        throwError('duplicate-component', `Duplicate component: ${compKey} ${name}`);
      };
  }
}
