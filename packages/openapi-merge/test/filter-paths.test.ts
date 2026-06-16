import { describe, expect, it } from 'vitest';
import { filterPaths } from '../src/core/filter-paths.js';
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

describe('filterPaths', () => {
  it('returns paths unchanged when filter is empty', () => {
    const result = filterPaths(paths, {});
    expect(result).toBe(paths);
  });

  it('returns paths unchanged when include and exclude are empty arrays', () => {
    const result = filterPaths(paths, { include: [], exclude: [] });
    expect(result).toBe(paths);
  });

  describe('include', () => {
    it('keeps only paths matching an exact include pattern', () => {
      const result = filterPaths(paths, { include: ['^/users$'] });
      expect(Object.keys(result)).toEqual(['/users']);
    });

    it('keeps all methods on a path when the path matches include', () => {
      const result = filterPaths(paths, { include: ['^/users$'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).toHaveProperty('post');
    });

    it('keeps only matching paths with a regex include pattern', () => {
      const result = filterPaths(paths, { include: ['^/users'] });
      expect(Object.keys(result)).toEqual(['/users', '/users/{id}']);
      expect(result).not.toHaveProperty('/admin/settings');
    });

    it('keeps a single method via path.method include pattern', () => {
      const result = filterPaths(paths, { include: ['/users/{id}.delete'] });
      expect(result['/users/{id}']).toHaveProperty('delete');
      expect(result['/users/{id}']).not.toHaveProperty('get');
    });

    it('keeps multiple methods matched by separate include patterns', () => {
      const result = filterPaths(paths, { include: ['/users.get', '/users.post'] });
      expect(result['/users']).toHaveProperty('get');
      expect(result['/users']).toHaveProperty('post');
    });

    it('drops path entirely when no methods match include', () => {
      const result = filterPaths(paths, { include: ['/users.patch'] });
      expect(result).not.toHaveProperty('/users');
    });
  });

  describe('exclude', () => {
    it('drops a path matching a literal exclude pattern', () => {
      const result = filterPaths(paths, { exclude: ['/admin/settings'] });
      expect(result).not.toHaveProperty('/admin/settings');
      expect(result).toHaveProperty('/users');
      expect(result).toHaveProperty('/users/{id}');
    });

    it('drops matching paths with a regex exclude pattern', () => {
      const result = filterPaths(paths, { exclude: ['^/admin'] });
      expect(result).not.toHaveProperty('/admin/settings');
    });

    it('drops only the excluded method, keeps the rest of the path', () => {
      const result = filterPaths(paths, { exclude: ['/users/{id}.delete'] });
      expect(result['/users/{id}']).toHaveProperty('get');
      expect(result['/users/{id}']).not.toHaveProperty('delete');
    });

    it('drops path entirely when all methods are excluded', () => {
      const result = filterPaths(paths, { exclude: ['/admin/settings.get'] });
      expect(result).not.toHaveProperty('/admin/settings');
    });
  });

  describe('include + exclude', () => {
    it('exclude wins when both match the same path', () => {
      const result = filterPaths(paths, { include: ['^/users'], exclude: ['/users/{id}'] });
      expect(result).toHaveProperty('/users');
      expect(result).not.toHaveProperty('/users/{id}');
    });

    it('exclude wins when both match the same path.method', () => {
      const result = filterPaths(paths, {
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

      const result = filterPaths(pathsWithMeta, { exclude: ['/users.delete'] });
      const item = result['/users'] as Record<string, unknown>;
      expect(item).toHaveProperty('summary', 'User endpoints');
      expect(item).toHaveProperty('parameters');
      expect(item).not.toHaveProperty('delete');
    });
  });
});
