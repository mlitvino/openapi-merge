import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';
import type { MergeOptions } from '../src/types.js';

type Schemas = Record<string, unknown>;

function spec(title: string, schemas: Schemas, paths: Record<string, unknown> = {}) {
  return {
    input: {
      openapi: '3.0.3',
      info: { title, version: '1.0.0' },
      paths,
      components: { schemas },
    },
  };
}

function mergeTwo(a: ReturnType<typeof spec>, b: ReturnType<typeof spec>, options: MergeOptions) {
  return merge([a, b], options);
}

const USER_A = { type: 'object', properties: { name: { type: 'string' } } };
const USER_B = { type: 'object', properties: { email: { type: 'string' } } };

describe('componentPolicy', () => {
  it('errors on a duplicate component name by default', () => {
    const result = mergeTwo(
      spec('A', { User: USER_A }),
      spec('B', { User: USER_B }),
      {},
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('duplicate-component');
    }
  });

  it('first-wins keeps the base component and drops the incoming one', () => {
    const result = mergeTwo(
      spec('A', { User: USER_A }),
      spec('B', { User: USER_B }),
      { componentPolicy: { mode: 'first-wins' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const schemas = result.output.components!.schemas as Record<string, typeof USER_A>;
      expect(Object.keys(schemas)).toEqual(['User']);
      expect(schemas.User.properties).toHaveProperty('name');
      expect(schemas.User.properties).not.toHaveProperty('email');
    }
  });

  it('merges non-colliding components from both specs', () => {
    const result = mergeTwo(
      spec('A', { User: USER_A }),
      spec('B', { Post: { type: 'object' } }),
      { componentPolicy: { mode: 'error' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const schemas = result.output.components!.schemas as Schemas;
      expect(Object.keys(schemas).sort()).toEqual(['Post', 'User']);
    }
  });

  describe('suffix mode ($ref rewriting)', () => {
    it('renames the colliding component and keeps both definitions', () => {
      const result = mergeTwo(
        spec('A', { User: USER_A }),
        spec('B', { User: USER_B }),
        { componentPolicy: { mode: 'suffix', value: '_v2' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schemas = result.output.components!.schemas as Record<string, typeof USER_A>;
        expect(Object.keys(schemas).sort()).toEqual(['User', 'User_v2']);
        expect(schemas.User.properties).toHaveProperty('name');
        expect(schemas.User_v2.properties).toHaveProperty('email');
      }
    });

    it('rewrites $ref pointers in the incoming spec paths', () => {
      const a = spec('A', { User: USER_A });
      const b = spec('B', { User: USER_B }, {
        '/b': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
        },
      });

      const result = mergeTwo(a, b, { componentPolicy: { mode: 'suffix', value: '_v2' } });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const op = result.output.paths!['/b'] as Record<string, any>;
        expect(op.get.responses['200'].content['application/json'].schema.$ref).toBe(
          '#/components/schemas/User_v2',
        );
      }
    });

    it('rewrites $ref pointers between components', () => {
      const a = spec('A', { User: USER_A });
      const b = spec('B', {
        User: USER_B,
        UserList: { type: 'array', items: { $ref: '#/components/schemas/User' } },
      });

      const result = mergeTwo(a, b, { componentPolicy: { mode: 'suffix', value: '_v2' } });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schemas = result.output.components!.schemas as Record<string, any>;
        expect(schemas.UserList.items.$ref).toBe('#/components/schemas/User_v2');
      }
    });

    it('does not touch refs to non-colliding components', () => {
      const a = spec('A', { User: USER_A });
      const b = spec('B', {
        User: USER_B,
        Post: { type: 'object', properties: { author: { $ref: '#/components/schemas/Post' } } },
      });

      const result = mergeTwo(a, b, { componentPolicy: { mode: 'suffix', value: '_v2' } });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schemas = result.output.components!.schemas as Record<string, any>;
        expect(schemas.Post.properties.author.$ref).toBe('#/components/schemas/Post');
      }
    });

    it('auto-resolves a suffix that itself collides', () => {
      const result = mergeTwo(
        spec('A', { User: USER_A, User_v2: { type: 'object' } }),
        spec('B', { User: USER_B }),
        { componentPolicy: { mode: 'suffix', value: '_v2' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schemas = result.output.components!.schemas as Schemas;
        expect(Object.keys(schemas).sort()).toEqual(['User', 'User_v2', 'User_v22']);
      }
    });

    it('does not clobber an incoming component that already uses the suffixed name', () => {
      const result = mergeTwo(
        spec('A', { User: USER_A }),
        spec('B', {
          User: USER_B,
          User_v2: { type: 'object', properties: { original: { type: 'string' } } },
        }),
        { componentPolicy: { mode: 'suffix', value: '_v2' } },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schemas = result.output.components!.schemas as Record<string, any>;
        expect(Object.keys(schemas).sort()).toEqual(['User', 'User_v2', 'User_v22']);
        expect(schemas.User_v2.properties).toHaveProperty('original');
        expect(schemas.User_v22.properties).toHaveProperty('email');
      }
    });
  });

  describe('rename mode', () => {
    it('renames via the custom function and rewrites refs', () => {
      const a = spec('A', { User: USER_A });
      const b = spec('B', { User: USER_B }, {
        '/b': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
        },
      });

      const result = mergeTwo(a, b, {
        componentPolicy: { mode: 'rename', fn: (category, name) => `B_${name}` },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schemas = result.output.components!.schemas as Schemas;
        expect(Object.keys(schemas).sort()).toEqual(['B_User', 'User']);
        const op = result.output.paths!['/b'] as Record<string, any>;
        expect(op.get.responses['200'].content['application/json'].schema.$ref).toBe(
          '#/components/schemas/B_User',
        );
      }
    });
  });
});
