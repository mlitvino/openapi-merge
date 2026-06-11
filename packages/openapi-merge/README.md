# openapi-merge

Merge multiple OpenAPI 3.0 documents into a single deterministic output.

## Features

- **Multiple input sources** — URL, file path, or in-memory object
- **Sync & async APIs** — `merge()` and `mergeAsync()`
- **Version validation** — Strict mode rejects non-3.0 documents
- **Path merging** — Combine paths from multiple specs; conflicts by method fail fast
- **Component merging** — Components are merged with suffixing for name conflicts
- **Top-level fields** — `info`, `servers`, `security`, `tags`, and `externalDocs` are taken from the first available spec
- **Deterministic output** — Input order controls merge order

## Install

```bash
npm install openapi-merge
```

## Quick start

```ts
import { merge } from 'openapi-merge';

const result = merge(
  [
    { input: './specs/public-api.json' },
    { input: './specs/admin-api.json' },
  ],
  { versionPolicy: { mode: 'strict', targetVersion: '3.0' } },
);

if (result.ok) {
  console.log(result.output); // merged OpenAPI 3.0 document
} else {
  console.error(result.error);
}
```

## Development

From the workspace root:

- `pnpm test` — run package tests
- `pnpm e2e` — run the e2e script
- `pnpm build` — build the package
- `pnpm typecheck` — run TypeScript checks
- `pnpm lint` — run ESLint

## License

MIT
