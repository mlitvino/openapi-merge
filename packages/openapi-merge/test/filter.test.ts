import { describe, expect, it } from 'vitest';
import { filterByPaths, filterByTags } from '../src/core/filter.js';
import type { PathsObject } from '@scalar/openapi-types/3.0';

const paths: PathsObject = {
  '/users': {
    get: { summary: 'List users', responses: {} },
    post: { summary: 'Create user', responses: {} },
  },
  '/users/{id}': {
    get: { summary: 'Get user', responses: {} },
    delete: { summary: 'Delete user', responses: {} },
  },
  '/admin/settings': {
    get: { summary: 'Get settings', responses: {} },
  },
};

describe('filterByPaths', () => {
  it('returns paths unchanged when filter is empty', () => {
    const result = filterByPaths(paths, {});
    expect(result).toBe(paths);
  });

  it('returns paths unchanged when include and exclude are empty arrays', () => {
    const result = filterByPaths(paths, { include: [], exclude: [] });
    expect(result).toBe(paths);
  });

  describe('include', () => {
    it('keeps only paths matching an exact include pattern', () => {
      const result = filterByPaths(paths, { include: ['^/users$'] });
      expect(Object.keys(result)).toEqual(['/users']);
    });

    it('keeps all methods on a path when the path matches include', () => {
      const result = filterByPaths(paths, { include: ['^/users$'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).toHaveProperty('post');
    });

    it('keeps only matching paths with a regex include pattern', () => {
      const result = filterByPaths(paths, { include: ['^/users'] });
      expect(Object.keys(result)).toEqual(['/users', '/users/{id}']);
      expect(result).not.toHaveProperty('/admin/settings');
    });

    it('keeps a single method via path.method include pattern', () => {
      const result = filterByPaths(paths, { include: ['/users/{id}.delete'] });
      expect(result['/users/{id}']).toHaveProperty('delete');
      expect(result['/users/{id}']).not.toHaveProperty('get');
    });

    it('keeps multiple methods matched by separate include patterns', () => {
      const result = filterByPaths(paths, { include: ['/users.get', '/users.post'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).toHaveProperty('post');
    });

    it('drops path entirely when no methods match include', () => {
      const result = filterByPaths(paths, { include: ['/users.patch'] });
      expect(result).not.toHaveProperty('/users');
    });
  });

  describe('exclude', () => {
    it('drops a path matching a literal exclude pattern', () => {
      const result = filterByPaths(paths, { exclude: ['/admin/settings'] });
      expect(result).not.toHaveProperty('/admin/settings');
      expect(result).toHaveProperty('/users');
      expect(result).toHaveProperty('/users/{id}');
    });

    it('drops matching paths with a regex exclude pattern', () => {
      const result = filterByPaths(paths, { exclude: ['^/admin'] });
      expect(result).not.toHaveProperty('/admin/settings');
    });

    it('drops only the excluded method, keeps the rest of the path', () => {
      const result = filterByPaths(paths, { exclude: ['/users/{id}.delete'] });
      expect(result['/users/{id}']).toHaveProperty('get');
      expect(result['/users/{id}']).not.toHaveProperty('delete');
    });

    it('drops path entirely when all methods are excluded', () => {
      const result = filterByPaths(paths, { exclude: ['/admin/settings.get'] });
      expect(result).not.toHaveProperty('/admin/settings');
    });
  });

  describe('include + exclude', () => {
    it('exclude wins when both match the same path', () => {
      const result = filterByPaths(paths, { include: ['^/users'], exclude: ['/users/{id}'] });
      expect(result).toHaveProperty('/users');
      expect(result).not.toHaveProperty('/users/{id}');
    });

    it('exclude wins when both match the same path.method', () => {
      const result = filterByPaths(paths, {
        include: ['/users'],
        exclude: ['/users.post'],
      });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).not.toHaveProperty('post');
    });
  });

  describe('non-operation fields', () => {
    it('preserves path-level fields on surviving paths', () => {
      const pathsWithMeta: PathsObject = {
        '/users': {
          summary: 'User endpoints',
          parameters: [{ name: 'X-Trace', in: 'header' }],
          get: { summary: 'List', responses: {} },
          delete: { summary: 'Delete', responses: {} },
        },
      };

      const result = filterByPaths(pathsWithMeta, { exclude: ['/users.delete'] });
      const item = result['/users'] as Record<string, unknown>;
      expect(item).toHaveProperty('summary', 'User endpoints');
      expect(item).toHaveProperty('parameters');
      expect(item).not.toHaveProperty('delete');
    });
  });
});

const taggedPaths: PathsObject = {
  '/users': {
    get: { summary: 'List users', tags: ['public'], responses: {} },
    post: { summary: 'Create user', tags: ['internal'], responses: {} },
  },
  '/admin': {
    get: { summary: 'Admin panel', tags: ['internal', 'admin'], responses: {} },
  },
  '/health': {
    get: { summary: 'Health check', responses: {} },
  },
};

describe('filterByTags', () => {
  it('returns paths unchanged when filter is empty', () => {
    const result = filterByTags(taggedPaths, {});
    expect(result).toBe(taggedPaths);
  });

  it('returns paths unchanged when include and exclude are empty arrays', () => {
    const result = filterByTags(taggedPaths, { include: [], exclude: [] });
    expect(result).toBe(taggedPaths);
  });

  describe('include', () => {
    it('keeps only operations that have an include tag', () => {
      const result = filterByTags(taggedPaths, { include: ['public'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).not.toHaveProperty('post');
    });

    it('drops path entirely when no operations match include', () => {
      const result = filterByTags(taggedPaths, { include: ['public'] });
      expect(result).not.toHaveProperty('/admin');
    });

    it('keeps operation when it matches any one of multiple include tags', () => {
      const result = filterByTags(taggedPaths, { include: ['public', 'admin'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/admin']).toHaveProperty('get');
      expect(result['/users']).not.toHaveProperty('post');
    });

    it('drops operations with no tags when include is set', () => {
      const result = filterByTags(taggedPaths, { include: ['public'] });
      expect(result).not.toHaveProperty('/health');
    });
  });

  describe('exclude', () => {
    it('removes operations that have an exclude tag', () => {
      const result = filterByTags(taggedPaths, { exclude: ['internal'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).not.toHaveProperty('post');
    });

    it('drops path entirely when all operations are excluded', () => {
      const result = filterByTags(taggedPaths, { exclude: ['internal'] });
      expect(result).not.toHaveProperty('/admin');
    });

    it('keeps operations with no tags when exclude is set', () => {
      const result = filterByTags(taggedPaths, { exclude: ['internal'] });
      expect(result).toHaveProperty('/health');
    });
  });

  describe('include + exclude', () => {
    it('exclude wins when operation matches both', () => {
      const result = filterByTags(taggedPaths, { include: ['internal'], exclude: ['admin'] });
      expect(result['/users']).toHaveProperty('post');
      expect(result).not.toHaveProperty('/admin');
    });
  });
});
