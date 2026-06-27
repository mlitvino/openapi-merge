import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';
import type { MergeOptions } from '../src/types.js';

function spec(title: string, paths: Record<string, unknown>) {
  return { input: { openapi: '3.0.3', info: { title, version: '1.0.0' }, paths } };
}

function mergeTwo(
  aPaths: Record<string, unknown>,
  bPaths: Record<string, unknown>,
  options: MergeOptions,
) {
  return merge([spec('A', aPaths), spec('B', bPaths)], options);
}

const GET = { get: { summary: 'List', responses: {} } };
const POST = { post: { summary: 'Create', responses: {} } };

describe('pathPolicy merge mode', () => {
  it('combines different methods on the same path', () => {
    const result = mergeTwo(
      { '/items': GET },
      { '/items': POST },
      { pathPolicy: { mode: 'merge' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const item = result.output.paths!['/items'] as Record<string, unknown>;
      expect(item).toHaveProperty('get');
      expect(item).toHaveProperty('post');
    }
  });

  it('leaves non-overlapping paths untouched', () => {
    const result = mergeTwo(
      { '/a': GET },
      { '/b': POST },
      { pathPolicy: { mode: 'merge' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/a');
      expect(result.output.paths).toHaveProperty('/b');
    }
  });

  describe('onMethodConflict', () => {
    it('errors by default when the same method collides', () => {
      const result = mergeTwo(
        { '/items': { get: { summary: 'A list', responses: {} } } },
        { '/items': { get: { summary: 'B list', responses: {} } } },
        { pathPolicy: { mode: 'merge' } },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('duplicate-method');
      }
    });

    it('first-wins keeps the base method on collision', () => {
      const result = mergeTwo(
        { '/items': { get: { summary: 'A list', responses: {} } } },
        { '/items': { get: { summary: 'B list', responses: {} } } },
        { pathPolicy: { mode: 'merge', onMethodConflict: 'first-wins' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const get = (result.output.paths!['/items'] as Record<string, Record<string, unknown>>).get;
        expect(get.summary).toBe('A list');
      }
    });

    it('last-wins overrides with the incoming method on collision', () => {
      const result = mergeTwo(
        { '/items': { get: { summary: 'A list', responses: {} } } },
        { '/items': { get: { summary: 'B list', responses: {} } } },
        { pathPolicy: { mode: 'merge', onMethodConflict: 'last-wins' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const get = (result.output.paths!['/items'] as Record<string, Record<string, unknown>>).get;
        expect(get.summary).toBe('B list');
      }
    });
  });

  describe('path-level metadata (first-wins)', () => {
    it('keeps base metadata when both define it', () => {
      const result = mergeTwo(
        { '/items': { summary: 'A summary', ...GET } },
        { '/items': { summary: 'B summary', ...POST } },
        { pathPolicy: { mode: 'merge' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const item = result.output.paths!['/items'] as Record<string, unknown>;
        expect(item.summary).toBe('A summary');
      }
    });

    it('fills a metadata gap from the incoming path item', () => {
      const result = mergeTwo(
        { '/items': GET },
        { '/items': { parameters: [{ name: 'page', in: 'query' }], ...POST } },
        { pathPolicy: { mode: 'merge' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const item = result.output.paths!['/items'] as Record<string, unknown>;
        expect(item).toHaveProperty('parameters');
      }
    });
  });
});
