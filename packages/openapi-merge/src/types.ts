import type { Document as OpenApiV3_0 } from '@scalar/openapi-types/3.0';

export type OpenApiDocument = object;

export type InputSource = { input: OpenApiDocument | string };

export type VersionPolicy = {
  mode: 'strict';
  targetVersion: '3.0';
} | {
  mode: 'skip';
};

export type PathPolicy = { mode: 'error' };

export type ComponentPolicy = { mode: 'error' };

export type TagFilter = {
  include?: string[];
  exclude?: string[];
};

export type PathFilter = {
  include?: string[];
  exclude?: string[];
};

export type PathRenameRule =
  | { type: 'rename'; from: string; to: string }
  | { type: 'regex'; from: string; to: string }
  | { type: 'fn'; from: string; to: (path: string) => string };

export type PathRename = PathRenameRule[];

export type MergeOptions = {
  versionPolicy?: VersionPolicy;
  pathPolicy?: PathPolicy;
  componentPolicy?: ComponentPolicy;
  tagFilter?: TagFilter;
  pathFilter?: PathFilter;
  pathRename?: PathRename;
};

export type ResolvedMergeOptions = Required<MergeOptions>;

export const DEFAULT_MERGE_OPTIONS: ResolvedMergeOptions = {
  versionPolicy: { mode: 'skip' },
  pathPolicy: { mode: 'error' },
  componentPolicy: { mode: 'error' },
  tagFilter: {},
  pathFilter: {},
  pathRename: [],
};

export function validateOptions(options?: MergeOptions): ResolvedMergeOptions {
  return {
    versionPolicy: options?.versionPolicy ?? DEFAULT_MERGE_OPTIONS.versionPolicy,
    pathPolicy: options?.pathPolicy ?? DEFAULT_MERGE_OPTIONS.pathPolicy,
    componentPolicy: options?.componentPolicy ?? DEFAULT_MERGE_OPTIONS.componentPolicy,
    tagFilter: options?.tagFilter ?? DEFAULT_MERGE_OPTIONS.tagFilter,
    pathFilter: options?.pathFilter ?? DEFAULT_MERGE_OPTIONS.pathFilter,
    pathRename: options?.pathRename ?? DEFAULT_MERGE_OPTIONS.pathRename,
  };
}

export type MergeResult =
  | { ok: true; output: OpenApiV3_0 }
  | { ok: false; error: MergeError };

export type MergeError =
  | { type: 'no-inputs'; message: string }
  | { type: 'invalid-version'; message: string }
  | { type: 'load-failed'; message: string }
  | { type: 'parse-error'; message: string }
  | { type: 'duplicate-path'; message: string }
  | { type: 'duplicate-component'; message: string }
  | { type: 'internal-error'; message: string };

export type MergeContext = {
  rawSpecs: unknown[];
  parsedSpecs: OpenApiV3_0[];
};
