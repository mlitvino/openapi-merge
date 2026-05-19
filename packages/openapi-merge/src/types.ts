export type OpenApiDocument = object;

export type InputSource = { input: OpenApiDocument | string };

export type MergeResult =
  | { ok: true; output: OpenApiDocument; }
  | { ok: false; };

export type MergeError =
  | { code: 'no-inputs'; message: string }

