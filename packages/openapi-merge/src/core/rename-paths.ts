import type { PathsObject } from '@scalar/openapi-types/3.0';
import type { PathRename, PathRenameRule } from '../types.js';

export function renamePaths(paths: PathsObject, rules: PathRename): PathsObject {
  if (rules.length === 0) return paths;

  const result: PathsObject = {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const renamedKey = rules.reduce((current, rule) => applyRule(current, rule), pathKey);
    result[renamedKey] = pathItem;
  }
  return result;
}

function applyRule(path: string, rule: PathRenameRule): string {
  switch (rule.type) {
    case 'rename': {
      return path === rule.from ? rule.to : path;
    }
    case 'regex': {
      try {
        return path.replace(new RegExp(rule.from), rule.to);
      } catch {
        return path;
      }
    }
    case 'fn': {
      return rule.to(path);
    }
  }
}
