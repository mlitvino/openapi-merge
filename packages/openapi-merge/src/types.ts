import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';

export type OpenApiDocument = object;

export type InputSource = { input: OpenApiDocument | string };

export type VersionPolicy = {
  mode: 'strict';
  targetVersion: '3.0';
};

export type MergeOptions = {
  versionPolicy?: VersionPolicy;
};

export type MergeResult =
  | { ok: true, output: OpenApiV3_0; }
  | { ok: false, error: MergeError; }

export type MergeError =
  | { type: 'no-inputs'; message: string }
  | { type: 'invalid-version'; message: string }

export type MergeContext = {
  rawSpecs: unknown[],
  parsedSpecs: OpenApiDocument[];
}
