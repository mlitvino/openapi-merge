# openapi-merge

Merge multiple OpenAPI 3.0 documents into a single deterministic output.

## Features

- **Multiple input sources** — URL, file path, or in-memory object
- **Sync & async APIs** — `merge()` and `mergeAsync()`
- **Version validation** — Strict mode rejects non-3.0 documents
- **Path merging** — Combine paths from multiple specs; conflicts by method
- **Component merging** — Schemas, parameters, responses, etc. with automatic suffixing on name conflicts
- **Top-level field replace** — `info`, `servers`, `security`, `tags` from later specs override earlier ones

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

## License

MIT
