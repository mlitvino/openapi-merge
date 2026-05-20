import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { merge } from '../../src/index.js';
import type { OpenApiDocument } from '../../src/types.js';

const caseDir = resolve(dirname(fileURLToPath(import.meta.url)));

function readJson(name: string): OpenApiDocument {
  return JSON.parse(readFileSync(resolve(caseDir, name), 'utf8')) as OpenApiDocument;
}

describe('object-merge', () => {
  it('merges two objects', () => {
    const api1 = readJson('openapi1.json');
    const api2 = readJson('openapi2.json');

    const result = merge([{ input: api1 }, { input: api2 }]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.openapi).toBe('3.0.4');
    }
  });
});
