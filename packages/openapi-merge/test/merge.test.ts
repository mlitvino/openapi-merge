import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { merge } from '../src/index.js';

const specDir = resolve(dirname(fileURLToPath(import.meta.url)), 'specs');

function readJson(name: string) {
  return JSON.parse(readFileSync(resolve(specDir, name), 'utf8')) as object;
}

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

  it('errors on conflicting components', () => {
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

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('component-conflict');
    }
  });

  it('merges two medium specs without conflicts', () => {
    const result = merge(
      [
        { input: readJson('pos-medium-1.json') },
        { input: readJson('pos-medium-2.json') },
      ],
      { versionPolicy: { mode: 'skip' } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const output = result.output as Record<string, unknown>;
      const paths = output.paths as Record<string, unknown>;
      const components = output.components as Record<string, any>;
      const usersPath = paths['/users'] as Record<string, any>;
      const userIdPath = paths['/users/{userId}'] as Record<string, any>;
      const projectsPath = paths['/projects'] as Record<string, any>;
      const projectIdPath = paths['/projects/{projectId}'] as Record<string, any>;

      expect(Object.keys(paths)).toEqual([
        '/users',
        '/users/{userId}',
        '/roles',
        '/projects',
        '/projects/{projectId}',
        '/reports/summary',
        '/reports/{reportId}',
      ]);

      expect(usersPath.get.summary).toBe('List users');
      expect(usersPath.get.operationId).toBe('listUsers');
      expect(usersPath.get.parameters).toHaveLength(2);
      expect(usersPath.get.responses['200'].headers['X-Total-Count'].$ref).toBe(
        '#/components/headers/TotalCountHeader',
      );

      expect(usersPath.post.summary).toBe('Create user');
      expect(usersPath.post.operationId).toBe('createUser');
      expect(usersPath.post.requestBody.content['application/json'].schema.$ref).toBe(
        '#/components/schemas/CreateUserRequest',
      );

      expect(userIdPath.get.operationId).toBe('getUserById');
      expect(userIdPath.get.responses['404'].$ref).toBe('#/components/responses/NotFoundError');
      expect(userIdPath.patch.operationId).toBe('updateUserStatus');
      expect(userIdPath.patch.requestBody.content['application/json'].schema.$ref).toBe(
        '#/components/schemas/UpdateUserStatusRequest',
      );

      expect(projectsPath.get.summary).toBe('List projects');
      expect(projectsPath.get.operationId).toBe('listProjects');
      expect(projectsPath.post.operationId).toBe('createProject');

      expect(projectIdPath.get.operationId).toBe('getProjectById');
      expect(projectIdPath.delete.operationId).toBe('deleteProject');

      expect(paths['/reports/summary']).toBeDefined();
      expect(paths['/reports/{reportId}']).toBeDefined();

      expect(output.info).toEqual({
        title: 'Medium API One',
        version: '1.0.0',
        description: 'A moderately sized OpenAPI document for merge testing.',
      });

      expect(output.servers).toEqual([
        {
          url: 'https://api.example.com/v1',
          description: 'Primary production server',
        },
      ]);

      expect(components.schemas.User.properties.email.format).toBe('email');
      expect(components.schemas.User.properties.profile.$ref).toBe(
        '#/components/schemas/UserProfile',
      );
      expect(components.schemas.UserListResponse.properties.items.items.$ref).toBe(
        '#/components/schemas/User',
      );
      expect(components.schemas.Project.properties.status.enum).toEqual([
        'planned',
        'active',
        'archived',
      ]);
      expect(components.schemas.Project.properties.metadata.$ref).toBe(
        '#/components/schemas/ProjectMetadata',
      );

      expect(components.parameters.PageParam.in).toBe('query');
      expect(components.parameters.CursorParam.in).toBe('query');
      expect(components.responses.BadRequestError.content['application/json'].schema.$ref).toBe(
        '#/components/schemas/ErrorResponse',
      );
      expect(components.responses.ProjectNotFoundError.content['application/json'].schema.$ref)
        .toBe(
          '#/components/schemas/ErrorResponse',
        );
      expect(components.headers.TotalCountHeader.schema.minimum).toBe(0);
      expect(components.securitySchemes.bearerAuth.scheme).toBe('bearer');
      expect(components.securitySchemes.apiKeyAuth.name).toBe('X-API-Key');
    }
  });
});
