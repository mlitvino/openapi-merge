import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';

const STRICT = { versionPolicy: { mode: 'strict', targetVersion: '3.0' } } as const;

function v3(title: string) {
  return { input: { openapi: '3.0.3', info: { title, version: '1.0.0' }, paths: {} } };
}

describe('versionPolicy: skip (default)', () => {
  it('silently drops non-3.0 documents and merges the rest', () => {
    const result = merge([
      v3('Good'),
      { input: { swagger: '2.0', info: { title: 'Old', version: '1' }, paths: {} } },
    ], { versionPolicy: { mode: 'skip' } });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.info!.title).toBe('Good');
    }
  });

  it('returns no-inputs when every document is dropped', () => {
    const result = merge([
      { input: { swagger: '2.0', info: { title: 'Old', version: '1' }, paths: {} } },
    ], { versionPolicy: { mode: 'skip' } });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('no-inputs');
    }
  });
});

describe('versionPolicy: strict', () => {
  it('accepts a 3.0.x document', () => {
    const result = merge([v3('A')], STRICT);
    expect(result.ok).toBe(true);
  });

  it('rejects Swagger 2.0', () => {
    const result = merge([
      { input: { swagger: '2.0', info: { title: 'Old', version: '1' }, paths: {} } },
    ], STRICT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('swagger-2-unsupported');
    }
  });

  it('rejects OpenAPI 3.1+', () => {
    const result = merge([
      { input: { openapi: '3.1.0', info: { title: 'New', version: '1' }, paths: {} } },
    ], STRICT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('unsupported-openapi');
    }
  });

  it('rejects a document with no version field', () => {
    const result = merge([
      { input: { info: { title: 'Nope', version: '1' }, paths: {} } },
    ], STRICT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('missing-version');
    }
  });
});
