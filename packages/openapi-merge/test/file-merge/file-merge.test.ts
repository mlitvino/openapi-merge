import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { merge } from '../../src/index.js';

const caseDir = resolve(dirname(fileURLToPath(import.meta.url)));
const api1Path = resolve(caseDir, 'openapi1.json');
const api2Path = resolve(caseDir, 'openapi2.json');

describe('file-merge', () => {
  it('merges two files', () => {
    const result = merge([{ input: api1Path }, { input: api2Path }]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.openapi).toBe('3.0.4');
    }
  });
});
