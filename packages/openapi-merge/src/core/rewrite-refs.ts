import type { ComponentsObject, Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';
import type { ComponentPolicy } from '../types.js';
import type { ComponentsMap } from './merge-paths.js';

const REF_PREFIX = '#/components/';

type RewritablePolicy = Extract<ComponentPolicy, { mode: 'suffix' | 'rename' }>;

export function resolveComponentConflicts(
  spec: OpenApiV3_0,
  baseComponents: ComponentsObject,
  policy: ComponentPolicy,
): OpenApiV3_0 {
  if (policy.mode === 'error' || policy.mode === 'first-wins') return spec;

  const cloned = structuredClone(spec);
  const components = (cloned.components ?? {}) as ComponentsMap;
  const refMap = buildRenameMap(baseComponents as ComponentsMap, components, policy);

  if (refMap.size === 0) return cloned;

  rewriteRefs(cloned, refMap);
  renameComponentKeys(components, refMap);

  return cloned;
}

function buildRenameMap(
  baseComponents: ComponentsMap,
  incomingComponents: ComponentsMap,
  policy: RewritablePolicy,
): Map<string, string> {
  const refMap = new Map<string, string>();

  for (const [category, compMap] of Object.entries(incomingComponents)) {
    if (!compMap || typeof compMap !== 'object') continue;

    const baseNames = baseComponents[category] ?? {};
    const taken = new Set(Object.keys(baseNames));

    for (const name of Object.keys(compMap)) {
      if (!(name in baseNames)) continue;

      const newName = uniqueName(name, category, taken, policy);
      taken.add(newName);
      refMap.set(`${REF_PREFIX}${category}/${name}`, `${REF_PREFIX}${category}/${newName}`);
    }
  }

  return refMap;
}

function uniqueName(
  name: string,
  category: string,
  taken: Set<string>,
  policy: RewritablePolicy,
): string {
  const base = policy.mode === 'suffix' ? `${name}${policy.value}` : policy.fn(category, name);

  let candidate = base;
  let counter = 2;
  while (taken.has(candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }

  return candidate;
}

function rewriteRefs(root: unknown, refMap: Map<string, string>): void {
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;

    if (Array.isArray(node)) {
      stack.push(...(node as unknown[]));
      continue;
    }

    const obj = node as Record<string, unknown>;
    const ref = obj.$ref;
    if (typeof ref === 'string') {
      const rewritten = refMap.get(ref);
      if (rewritten !== undefined) obj.$ref = rewritten;
    }

    stack.push(...Object.values(obj));
  }
}

function renameComponentKeys(components: ComponentsMap, refMap: Map<string, string>): void {
  for (const [oldRef, newRef] of refMap) {
    const [category, oldName] = oldRef.slice(REF_PREFIX.length).split('/');
    const newName = newRef.slice(REF_PREFIX.length).split('/')[1];

    const categoryMap = components[category];
    if (!categoryMap || !(oldName in categoryMap)) continue;

    categoryMap[newName] = categoryMap[oldName];
    delete categoryMap[oldName];
  }
}
