import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';

import { throwError } from './errors.js';
import type { MergeContext, MergeOptions } from './types';

export function validate(ctx: MergeContext, options?: MergeOptions): void {
  validateVersions(ctx, options?.versionPolicy);
}

export function validateVersions(
  ctx: MergeContext,
  policy: MergeOptions['versionPolicy'],
): void {
  if (policy === undefined || policy?.mode === 'skip') {
    ctx.parsedSpecs = ctx.rawSpecs.filter((spec) => isOpenApiV3_0(spec));
    return;
  }

  for (const spec of ctx.rawSpecs) {
    if (!isOpenApiV3_0(spec)) {
      throwError(
        'invalid-version',
        `Unsupported or invalid OpenAPI v${policy.targetVersion} document.`,
      );
    }

    ctx.parsedSpecs.push(spec);
  }
}

function isOpenApiV3_0(value: unknown): value is OpenApiV3_0 {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.openapi === 'string' && value.openapi.startsWith('3.0')) {
    return true;
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
