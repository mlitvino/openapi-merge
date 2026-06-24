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
  if (policy === undefined || policy.mode === 'skip') {
    ctx.parsedSpecs = ctx.rawSpecs.filter((spec) => isOpenApiV3_0(spec));
    return;
  }

  for (const spec of ctx.rawSpecs) {
    if (!isRecord(spec)) {
      throwError('missing-version', 'Document is not a valid object.');
    }

    if (isSwagger2(spec)) {
      throwError('swagger-2-unsupported', 'Swagger 2.0 documents are not supported.');
    }

    if (isUnsupportedOpenApi(spec)) {
      throwError(
        'unsupported-openapi',
        `Unsupported OpenAPI version: ${String(spec.openapi)}. Only OpenAPI 3.0.x is supported.`,
      );
    }

    if (!isOpenApiV3_0(spec)) {
      throwError('missing-version', 'Document is missing a valid openapi version field.');
    }

    ctx.parsedSpecs.push(spec);
  }
}

function isOpenApiV3_0(value: unknown): value is OpenApiV3_0 {
  return isRecord(value) && typeof value.openapi === 'string' && value.openapi.startsWith('3.0');
}

function isSwagger2(spec: Record<string, unknown>): boolean {
  return spec.swagger === '2.0';
}

function isUnsupportedOpenApi(spec: Record<string, unknown>): boolean {
  return typeof spec.openapi === 'string' && !spec.openapi.startsWith('3.0');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
