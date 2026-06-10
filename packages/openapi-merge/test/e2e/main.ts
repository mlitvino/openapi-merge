import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { merge } from '../../src/index.js';

const caseDir = resolve(dirname(fileURLToPath(import.meta.url)));
const api1Path = resolve(caseDir, '../specs/simple-1.json');
const api2Path = resolve(caseDir, '../specs/simple-2.json');

const api1 = JSON.parse(readFileSync(api1Path, 'utf8')) as object;

const objectResult = merge(
  [
    { input: api1 },
    { input: api2Path },
  ],
  {
    versionPolicy: { mode: 'strict', targetVersion: '3.0' },
  },
);

console.log('result:', JSON.stringify(objectResult, null, 2));
