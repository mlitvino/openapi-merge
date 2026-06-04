import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';

describe('merge (MVP)', () => {
  it('returns error for empty inputs', () => {
    const result = merge([], { versionPolicy: { mode: 'skip' } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('no-inputs');
    }
  });

  it('merges two object specs with non-overlapping paths', () => {
    const result = merge(
      [
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'API One', version: '1.0.0' },
            paths: {
              '/hello': {
                get: {
                  summary: 'Hello',
                  responses: { '200': { description: 'ok' } },
                },
              },
            },
          },
        },
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'API Two', version: '2.0.0' },
            servers: [{ url: 'https://api.example.com' }],
            paths: {
              '/goodbye': {
                post: {
                  summary: 'Goodbye',
                  responses: { '200': { description: 'ok' } },
                },
              },
            },
          },
        },
      ],
      { versionPolicy: { mode: 'skip' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const output = result.output as Record<string, unknown>;
      const paths = output.paths as Record<string, unknown>;
      expect(Object.keys(paths)).toHaveLength(2);
      expect(paths['/hello']).toBeDefined();
      expect(paths['/goodbye']).toBeDefined();

      const info = output.info as { title: string; version: string };
      expect(info.title).toBe('API One');
      expect(info.version).toBe('1.0.0');

      expect(output.servers).toEqual([{ url: 'https://api.example.com' }]);
    }
  });

  it('merges methods on same path without conflict', () => {
    const result = merge(
      [
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'A', version: '1.0.0' },
            paths: {
              '/items': {
                get: { summary: 'List', responses: {} },
              },
            },
          },
        },
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'B', version: '1.0.0' },
            paths: {
              '/items': {
                post: { summary: 'Create', responses: {} },
              },
            },
          },
        },
      ],
      { versionPolicy: { mode: 'skip' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const paths = result.output.paths as Record<string, unknown>;
      const item = paths['/items'] as Record<string, unknown>;
      expect(item.get).toBeDefined();
      expect(item.post).toBeDefined();
    }
  });

  it('errors on conflicting same-path same-method', () => {
    const result = merge(
      [
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'A', version: '1.0.0' },
            paths: {
              '/items': {
                get: { summary: 'First', responses: {} },
              },
            },
          },
        },
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'B', version: '1.0.0' },
            paths: {
              '/items': {
                get: { summary: 'Second', responses: {} },
              },
            },
          },
        },
      ],
      { versionPolicy: { mode: 'skip' } },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('duplicate-path');
    }
  });

  it('merges components with conflict suffixing', () => {
    const result = merge(
      [
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'A', version: '1.0.0' },
            paths: {},
            components: {
              schemas: {
                User: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
        },
        {
          input: {
            openapi: '3.0.3',
            info: { title: 'B', version: '1.0.0' },
            paths: {},
            components: {
              schemas: {
                User: { type: 'object', properties: { email: { type: 'string' } } },
                Post: { type: 'object', properties: { title: { type: 'string' } } },
              },
            },
          },
        },
      ],
      { versionPolicy: { mode: 'skip' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const comps = (result.output as Record<string, unknown>).components as Record<
        string,
        Record<string, unknown>
      >;
      const schemas = comps.schemas;
      expect(schemas.User).toBeDefined();
      expect(schemas.User_v2).toBeDefined();
      expect(schemas.Post).toBeDefined();
    }
  });
});
