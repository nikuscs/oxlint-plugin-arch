# arch/comments-header

Reports a file whose first line is not the required header comment.

```ts
// { comment: '^// @module-tag integration$', imports: '/support/app\\.layer' }
// ❌
import { layer } from '@effect/vitest'
// @module-tag integration
import { AppLayer } from '../support/app.layer.ts'

// ✅
// @module-tag integration
import { layer } from '@effect/vitest'
import { AppLayer } from '../support/app.layer.ts'
```

The header is a comment, written as in the source with its `//` or `/* */`, that matches `comment` and starts at line 1, column 0. A matching comment further down reports where it is, so a header that import sorting pushed below an import is found; without one the report is on line 1. There is no fix.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `comment` | `string` | required | Regex the whole header comment must match |
| `imports` | `string \| string[]` | none | Regexes on import sources (`import` and `export … from`); when set, only a file importing a match needs the header |
| `files` | `string \| string[]` | none | File globs; when set, only matching files need the header |
| `message` | `string` | none | Text added to every report |

```ts
'arch/comments-header': ['error', { comment: '^// @module-tag integration$', imports: '/support/app\\.layer' }]
'arch/comments-header': ['error', { comment: '^/\\*\\* @vitest-environment jsdom \\*/$', files: '**/*.dom.test.tsx' }]
```
