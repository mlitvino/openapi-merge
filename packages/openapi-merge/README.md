# @mlitvino/openapi-merge

Merge multiple OpenAPI 3.0 documents into a single deterministic specification, with
governed conflict resolution for paths, components, and operationIds — plus `$ref`
integrity preservation when components are renamed.

## Features

- **Multiple input sources** — file path, URL, or in-memory object
- **Sync & async APIs** — `merge()` for files/objects, `mergeAsync()` when any input is a URL
- **Version validation** — `skip` (drop non-3.0 docs) or `strict` (reject them)
- **Governed conflict policies** — explicit, configurable strategies for paths, methods, components, and operationIds; nothing is merged silently
- **`$ref` integrity** — renaming a colliding component rewrites every `$ref` that pointed to it, across the whole document
- **Pre-merge transforms** — filter operations by tag, include/exclude paths by regex, and rename path keys
- **Throw-free result** — every call returns a discriminated union; errors are values, never exceptions
- **Deterministic output** — input order controls merge order

## Install

```bash
npm install @mlitvino/openapi-merge
```

## Quick start

```ts
import { merge } from '@mlitvino/openapi-merge';

const result = merge([
  { input: './specs/public-api.json' },
  { input: './specs/admin-api.json' },
]);

if (result.ok) {
  console.log(result.output); // merged OpenAPI 3.0 document
} else {
  console.error(result.error.type, result.error.message);
}
```

For URL inputs, use the async API:

```ts
import { mergeAsync } from '@mlitvino/openapi-merge';

const result = await mergeAsync([
  { input: 'https://api.example.com/openapi.json' },
  { input: './specs/local.yaml' },
]);
```

## Result type

`merge` / `mergeAsync` never throw. They return:

```ts
type MergeResult =
  | { ok: true; output: OpenApiV3_0 }
  | { ok: false; error: MergeError };
```

`MergeError` is a tagged union (`type` + `message`), e.g. `no-inputs`, `duplicate-path`,
`duplicate-method`, `duplicate-component`, `duplicate-operationid`, `swagger-2-unsupported`.

## Options

All options are optional. Defaults shown below.

```ts
merge(inputs, {
  versionPolicy:     { mode: 'skip' },
  pathPolicy:        { mode: 'merge', onMethodConflict: 'error' },
  componentPolicy:   { mode: 'error' },
  operationIdPolicy: { mode: 'error' },
  tagFilter:         {},
  pathFilter:        {},
  pathRename:        [],
});
```

### `versionPolicy`

- `{ mode: 'skip' }` *(default)* — silently drop any document that isn't OpenAPI 3.0
- `{ mode: 'strict', targetVersion: '3.0' }` — throw on Swagger 2.0, OpenAPI 3.1+, or a missing version field

### `pathPolicy`

Controls what happens when two specs define the same path.

- `{ mode: 'error' }` — any duplicate path returns a `duplicate-path` error
- `{ mode: 'merge', onMethodConflict? }` *(default)* — combine the methods of both path items.
  Path-level metadata (summary, description, parameters, servers) is first-wins. When the
  **same method** is defined on both, `onMethodConflict` decides:
  - `'error'` *(default)* → `duplicate-method` error
  - `'first-wins'` → keep the base spec's operation
  - `'last-wins'` → use the incoming spec's operation

### `componentPolicy`

Controls what happens when two specs define a component with the same name.

- `{ mode: 'error' }` *(default)* — `duplicate-component` error
- `{ mode: 'first-wins' }` — keep the base component, drop the incoming one
- `{ mode: 'suffix', value: string }` — rename the incoming component (`User` → `User_v2`) and
  rewrite every `$ref` that pointed to it. Suffix collisions are auto-resolved with a counter.
- `{ mode: 'rename', fn: (category, name) => string }` — custom rename, also with full `$ref` rewriting

```ts
merge(inputs, { componentPolicy: { mode: 'suffix', value: '_v2' } });
```

### `operationIdPolicy`

- `{ mode: 'error' }` *(default)* — a duplicate `operationId` anywhere in the merged output returns a `duplicate-operationid` error

### `tagFilter`

Filter operations by their `tags` before merging. `exclude` wins over `include`. Path items
left with no operations are dropped.

```ts
merge(inputs, { tagFilter: { include: ['public'], exclude: ['internal'] } });
```

### `pathFilter`

Regex matching on path keys (`/users`) and `path.method` notation (`/users.get`). Applied
after tag filtering.

```ts
merge(inputs, { pathFilter: { include: ['^/v1/'], exclude: ['\\.delete$'] } });
```

### `pathRename`

Ordered rename rules applied per path key.

```ts
merge(inputs, {
  pathRename: [
    { type: 'regex', from: '^/v1', to: '/api' },
    { type: 'rename', from: '/api/old', to: '/api/new' },
    { type: 'fn', from: '', to: (path) => `/prefix${path}` },
  ],
});
```

## Top-level fields

`info`, `servers`, `security`, `tags`, and `externalDocs` are taken from the first spec that
defines them (first-wins).

## License

MIT
