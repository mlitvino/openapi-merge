import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';

function spec(title: string, paths: Record<string, unknown>) {
  return { input: { openapi: '3.0.3', info: { title, version: '1.0.0' }, paths } };
}

describe('operationIdPolicy: error (default)', () => {
  it('errors on a duplicate operationId across specs', () => {
    const result = merge([
      spec('A', { '/a': { get: { operationId: 'list', responses: {} } } }),
      spec('B', { '/b': { get: { operationId: 'list', responses: {} } } }),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('duplicate-operationid');
    }
  });

  it('errors on a duplicate operationId across methods of one merged path', () => {
    const result = merge([
      spec('A', { '/items': { get: { operationId: 'dup', responses: {} } } }),
      spec('B', { '/items': { post: { operationId: 'dup', responses: {} } } }),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('duplicate-operationid');
    }
  });

  it('allows unique operationIds', () => {
    const result = merge([
      spec('A', { '/a': { get: { operationId: 'listA', responses: {} } } }),
      spec('B', { '/b': { get: { operationId: 'listB', responses: {} } } }),
    ]);

    expect(result.ok).toBe(true);
  });

  it('ignores operations without an operationId', () => {
    const result = merge([
      spec('A', { '/a': { get: { responses: {} } } }),
      spec('B', { '/b': { get: { responses: {} } } }),
    ]);

    expect(result.ok).toBe(true);
  });
});
