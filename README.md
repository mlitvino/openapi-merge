# @mlitvino/openapi-merge

Merge multiple OpenAPI 3.0 documents into a single deterministic specification, with
governed conflict resolution for paths, components, and operationIds.

## Install

```bash
npm install @mlitvino/openapi-merge
```

## How to run

Use `merge()` for file/object inputs, or `mergeAsync()` when any input is a URL. Neither
throws — both return a result you check with `result.ok`.

```ts
import { merge } from '@mlitvino/openapi-merge';

const result = merge([
  { input: './specs/public-api.json' },   // file path
  { input: adminApiObject },               // in-memory object
]);

if (result.ok) {
  console.log(result.output); // merged OpenAPI 3.0 document
} else {
  console.error(result.error.type, result.error.message);
}
```

```ts
import { mergeAsync } from '@mlitvino/openapi-merge';

const result = await mergeAsync([
  { input: 'https://api.example.com/openapi.json' }, // URL requires mergeAsync
  { input: './specs/local.yaml' },
]);
```

Each input is `{ input: string | object }` — a file path, an `http(s)` URL, or a parsed
OpenAPI object. JSON and YAML files are both supported.

## Configuration

Pass an options object as the second argument. Every option is optional; defaults shown.

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

| Option | What to put | Effect |
|---|---|---|
| `versionPolicy` | `{ mode: 'skip' }` \| `{ mode: 'strict', targetVersion: '3.0' }` | `skip` drops non-3.0 docs; `strict` rejects them (Swagger 2, 3.1+, missing version) |
| `pathPolicy` | `{ mode: 'error' }` \| `{ mode: 'merge', onMethodConflict }` | On a duplicate path: error, or merge the methods. `onMethodConflict` is `'error'` \| `'first-wins'` \| `'last-wins'` |
| `componentPolicy` | `{ mode: 'error' \| 'first-wins' }` \| `{ mode: 'suffix', value }` \| `{ mode: 'rename', fn }` | On a duplicate component name: error, keep base, or rename the incoming one and rewrite every `$ref` to it |
| `operationIdPolicy` | `{ mode: 'error' }` | Duplicate `operationId` anywhere → `duplicate-operationid` error |
| `tagFilter` | `{ include?: string[], exclude?: string[] }` | Keep/drop operations by tag before merging (`exclude` wins) |
| `pathFilter` | `{ include?: string[], exclude?: string[] }` | Regex match on `/path` and `/path.method` |
| `pathRename` | `PathRenameRule[]` | Ordered rules: `{ type: 'rename', from, to }`, `{ type: 'regex', from, to }`, `{ type: 'fn', from, to }` |

Example — combine methods, keep the first on conflict, and namespace incoming components:

```ts
merge(inputs, {
  pathPolicy: { mode: 'merge', onMethodConflict: 'first-wins' },
  componentPolicy: { mode: 'suffix', value: '_v2' },
  tagFilter: { exclude: ['internal'] },
});
```

## Result

```ts
type MergeResult =
  | { ok: true; output: OpenApiV3_0 }
  | { ok: false; error: MergeError };
```

For the full option reference see [`packages/openapi-merge/README.md`](packages/openapi-merge/README.md).

---

## Workspace / development

This is a pnpm monorepo; the library lives in `packages/openapi-merge`.

**Requirements:** Node.js 18+, pnpm.
