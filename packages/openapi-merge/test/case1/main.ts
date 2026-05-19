import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { merge } from '../../src/index.js';

const caseDir = resolve(dirname(fileURLToPath(import.meta.url)));
const api1 = JSON.parse(readFileSync(resolve(caseDir, 'openapi1.json'), 'utf8'));
const api2 = JSON.parse(readFileSync(resolve(caseDir, 'openapi2.json'), 'utf8'));

const result = merge([
  { input: api1 },
  { input: api2 },
]);

console.log(result);
