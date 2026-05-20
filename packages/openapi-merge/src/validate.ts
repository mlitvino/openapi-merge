import { err } from './errors.js';
import type { MergeOptions, MergeResult } from './types';

export function validate(rawSpecs: unknown[], options?: MergeOptions): MergeResult | null {
  const versionError = validateVersions(rawSpecs, options?.versionPolicy);
  if (versionError) {
    return versionError;
  }

  return null;
}

export function validateVersions(
  rawSpecs: unknown[],
  policy: MergeOptions['versionPolicy']
): MergeResult | null {
  if (!policy) {
    return null;
  }

  for (const spec of rawSpecs) {
    if (!isRecord(spec)) {
      return err('invalid-version', 'OpenAPI document must be an object.');
    }

    const version = typeof spec.openapi === 'string' ? spec.openapi : '';
    if (!version.startsWith(`${policy.targetVersion}.`)) {
      return err(
        'invalid-version',
        `Unsupported OpenAPI version: ${version || 'unknown'}. Expected ${policy.targetVersion}.x`
      );
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
