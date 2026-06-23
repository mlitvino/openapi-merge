import type { PathsObject } from '@scalar/openapi-types/3.0';
import type { PathFilter, TagFilter } from '../types.js';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

export function filterByPaths(paths: PathsObject, filter: PathFilter): PathsObject {
  const { include, exclude } = filter;

  if (!include?.length && !exclude?.length) {
    return paths;
  }

  const result: PathsObject = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const filteredItem = { ...(pathItem as Record<string, unknown>) };

    const pathMatchesInclude = include?.length ? matchesAny(pathKey, include) : false;
    const pathMatchesExclude = exclude?.length ? matchesAny(pathKey, exclude) : false;

    for (const method of HTTP_METHODS) {
      if (!(method in filteredItem)) continue;

      const pathMethod = `${pathKey}.${method}`;

      if (include?.length && !pathMatchesInclude && !matchesAny(pathMethod, include)) {
        delete filteredItem[method];
        continue;
      }

      if (exclude?.length && (pathMatchesExclude || matchesAny(pathMethod, exclude))) {
        delete filteredItem[method];
      }
    }

    const hasOperations = HTTP_METHODS.some(m => m in filteredItem);
    if (hasOperations) {
      result[pathKey] = filteredItem;
    }
  }

  return result;
}

export function filterByTags(paths: PathsObject, filter: TagFilter): PathsObject {
  const { include, exclude } = filter;

  if (!include?.length && !exclude?.length) return paths;

  const result: PathsObject = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const filteredItem = { ...(pathItem as Record<string, unknown>) };

    for (const method of HTTP_METHODS) {
      if (!(method in filteredItem)) continue;

      const op = filteredItem[method] as { tags?: string[] } | null;
      const tags = op?.tags ?? [];

      if (include?.length && !tags.some((t) => include.includes(t))) {
        delete filteredItem[method];
        continue;
      }
      if (exclude?.length && tags.some((t) => exclude.includes(t))) {
        delete filteredItem[method];
      }
    }

    if (HTTP_METHODS.some((m) => m in filteredItem)) {
      result[pathKey] = filteredItem;
    }
  }

  return result;
}

function matchesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(value);
    } catch {
      return value === pattern;
    }
  });
}
