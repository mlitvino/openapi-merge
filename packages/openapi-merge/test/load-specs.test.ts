import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadSpecs, loadSpecsAsync } from '../src/load.js';
import type { MergeContext, OpenApiDocument } from '../src/types.js';

const caseDir = resolve(dirname(fileURLToPath(import.meta.url)), 'specs');
const api1Path = resolve(caseDir, 'openapi1.json');
const api2Path = resolve(caseDir, 'openapi2.json');

function readJson(name: string): OpenApiDocument {
  return JSON.parse(readFileSync(resolve(caseDir, name), 'utf8')) as OpenApiDocument;
}

function createContext(): MergeContext {
  return { rawSpecs: [], parsedSpecs: [] };
}

describe('loadSpecs', () => {
  it('loads object inputs', () => {
    const ctx = createContext();
    const api1 = readJson('openapi1.json');
    const api2 = readJson('openapi2.json');

    loadSpecs([{ input: api1 }, { input: api2 }], ctx);

    expect(ctx.rawSpecs).toHaveLength(2);
    expect((ctx.rawSpecs[0] as { openapi?: string }).openapi).toBe('3.0.3');
  });

  it('loads file inputs', () => {
    const ctx = createContext();

    loadSpecs([{ input: api1Path }, { input: api2Path }], ctx);

    expect(ctx.rawSpecs).toHaveLength(2);
    expect((ctx.rawSpecs[1] as { openapi?: string }).openapi).toBe('3.0.3');
  });
});

describe('loadSpecsAsync', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads url inputs', async () => {
    const ctx = createContext();
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'x', version: '1.0.0' },
          paths: {},
        }),
    };

    vi.stubGlobal('fetch', vi.fn(async () => mockResponse) as unknown as typeof fetch);

    await loadSpecsAsync([{ input: 'https://example.com/openapi.json' }], ctx);

    expect(ctx.rawSpecs).toHaveLength(1);
    expect((ctx.rawSpecs[0] as { openapi?: string }).openapi).toBe('3.0.3');

  });

  it('loads mixed inputs (object, file, url)', async () => {
    const ctx = createContext();
    const api1 = readJson('openapi1.json');
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'x', version: '1.0.0' },
          paths: {},
        }),
    };

    vi.stubGlobal('fetch', vi.fn(async () => mockResponse) as unknown as typeof fetch);

    await loadSpecsAsync(
      [{ input: api1 }, { input: api1Path }, { input: 'https://example.com/openapi.json' }],
      ctx
    );

    expect(ctx.rawSpecs).toHaveLength(3);
    expect((ctx.rawSpecs[0] as { openapi?: string }).openapi).toBe('3.0.3');
    expect((ctx.rawSpecs[1] as { openapi?: string }).openapi).toBe('3.0.3');
    expect((ctx.rawSpecs[2] as { openapi?: string }).openapi).toBe('3.0.3');
  });
});
