import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';

function spec(paths: Record<string, unknown>) {
  return { openapi: '3.0.3', info: { title: 'A', version: '1.0.0' }, paths };
}

const GET = { get: { summary: 'op', responses: {} } };

describe('pathRename — rename type', () => {
  it('renames an exact path match', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET }) }],
      { pathRename: [{ type: 'rename', from: '/v1/users', to: '/api/users' }] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/users');
      expect(result.output.paths).not.toHaveProperty('/v1/users');
    }
  });

  it('leaves non-matching paths unchanged', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET, '/v1/posts': GET }) }],
      { pathRename: [{ type: 'rename', from: '/v1/users', to: '/api/users' }] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/users');
      expect(result.output.paths).toHaveProperty('/v1/posts');
    }
  });
});

describe('pathRename — regex type', () => {
  it('replaces a prefix on all matching paths', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET, '/v1/posts': GET, '/v2/orders': GET }) }],
      { pathRename: [{ type: 'regex', from: '^/v1', to: '/api' }] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/users');
      expect(result.output.paths).toHaveProperty('/api/posts');
      expect(result.output.paths).toHaveProperty('/v2/orders');
    }
  });

  it('supports capture groups', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET }) }],
      { pathRename: [{ type: 'regex', from: '^/v1(.*)', to: '/api/v1$1' }] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/v1/users');
    }
  });
});

describe('pathRename — fn type', () => {
  it('applies a function transform', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET, '/v1/posts': GET }) }],
      { pathRename: [{ type: 'fn', from: '', to: (p) => p.replace('/v1', '/api') }] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/users');
      expect(result.output.paths).toHaveProperty('/api/posts');
    }
  });
});

describe('pathRename — ordered application', () => {
  it('applies rules sequentially, each rule sees the output of the previous', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET }) }],
      {
        pathRename: [
          { type: 'regex', from: '^/v1', to: '/api/v1' },
          { type: 'rename', from: '/api/v1/users', to: '/api/v1/people' },
        ],
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/v1/people');
    }
  });

  it('reversed order produces a different result', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET }) }],
      {
        pathRename: [
          { type: 'rename', from: '/api/v1/users', to: '/api/v1/people' },
          { type: 'regex', from: '^/v1', to: '/api/v1' },
        ],
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      // first rule doesn't match /v1/users, second renames to /api/v1/users
      expect(result.output.paths).toHaveProperty('/api/v1/users');
      expect(result.output.paths).not.toHaveProperty('/api/v1/people');
    }
  });
});

describe('pathRename — interaction with pathFilter', () => {
  it('filter runs before rename: excluded paths are not renamed', () => {
    const result = merge(
      [{ input: spec({ '/v1/users': GET, '/v1/admin': GET }) }],
      {
        pathFilter: { exclude: ['^/v1/admin$'] },
        pathRename: [{ type: 'regex', from: '^/v1', to: '/api' }],
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.paths).toHaveProperty('/api/users');
      expect(result.output.paths).not.toHaveProperty('/api/admin');
      expect(result.output.paths).not.toHaveProperty('/v1/admin');
    }
  });
});
