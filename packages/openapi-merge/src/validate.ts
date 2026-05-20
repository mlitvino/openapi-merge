import { throwMergeError } from './errors.js';
import type { MergeOptions } from './types';

export function validate(rawSpecs: unknown[], options?: MergeOptions): void {
  validateVersions(rawSpecs, options?.versionPolicy);
}

export function validateVersions(
  rawSpecs: unknown[],
  policy: MergeOptions['versionPolicy']
): void {
  if (!policy) {
    return;
  }

  for (const spec of rawSpecs) {
    if (!isRecord(spec)) {
      throwMergeError('invalid-version', 'OpenAPI document must be an object.');
    }

    const version = typeof spec.openapi === 'string' ? spec.openapi : '';
    if (!version.startsWith(`${policy.targetVersion}.`)) {
      throwMergeError(
        'invalid-version',
        `Unsupported OpenAPI version: ${version || 'unknown'}. Expected ${policy.targetVersion}.x`
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
