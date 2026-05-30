import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

import type { InputSource, MergeContext } from './types.js';
import { throwMergeError } from './errors.js';

export async function loadSpecsAsync(inputs: InputSource[], ctx: MergeContext): Promise<void> {
  for (const { input } of inputs) {
    if (typeof input === 'object') {
      ctx.rawSpecs.push(input);
      continue;
    }

    if (isUrl(input)) {
      ctx.rawSpecs.push(await loadFromUrlAsync(input));
      continue;
    }

    ctx.rawSpecs.push(loadFromFile(input));
  }
}

export function loadSpecs(inputs: InputSource[], ctx: MergeContext): void {
  for (const { input } of inputs) {
    if (typeof input === 'object') {
      ctx.rawSpecs.push(input);
      continue;
    }

    if (isUrl(input)) {
      throwMergeError('load-failed', `URL input requires async loading: ${input}`);
    }

    ctx.rawSpecs.push(loadFromFile(input));
  }
}

async function loadFromUrlAsync(url: string): Promise<unknown> {
  let lastError: unknown;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return parseSpec(text);
  } catch (error) {
    lastError = error;
  }

  const message = lastError instanceof Error ? lastError.message : 'Unknown fetch error';
  throwMergeError('load-failed', `Failed to load URL: ${url}. ${message}`);
}

function loadFromFile(filepath: string): unknown {
  const text = readFileSync(filepath, 'utf8');
  return parseSpec(text);
}

function parseSpec(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // continue
  }

  try {
    return parseYaml(text) as unknown;
  } catch {
    // continue
  }

  throwMergeError('parse-error', 'Failed to parse spec file.');
}

function isUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
