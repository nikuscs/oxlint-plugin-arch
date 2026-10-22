# `arch/chain-newline` 🔧

Puts each method call in a configured matching chain on its own aligned line.

## Why

Selected long chains are easier to read vertically. Groups let a project target chains by depth, method names, or root identifier.

> [!WARNING]
> Oxfmt and Prettier collapse short chains back onto one line. Do not run this rule on files a formatter also rewrites, or they will undo each other forever.

## Examples

❌ Incorrect

```ts
items.filter(active).map(toName).sort()
```

✅ Correct

```ts
items
  .filter(active)
  .map(toName)
  .sort()
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `groups` | `ChainGroup[]` | required | Lists matching groups. A chain is checked when any group matches. |
| `groups[].minDepth` | `integer >= 1` | required | Sets the minimum number of method calls in the chain. |
| `groups[].methods` | `string[]` | none | Matches when any chain method is listed. |
| `groups[].onlyMethods` | `string[]` | none | Matches when every chain method is listed. |
| `groups[].rootPattern` | `string \| string[]` | none | Matches the root identifier against regular expressions. |
| `indent` | `integer >= 0 \| 'tab'` | `2` | Sets indentation for each method line. |

Criteria inside one group use OR semantics.

```ts
// oxlint.config.ts
rules: {
  'arch/chain-newline': ['error', {
    groups: [{ minDepth: 3, methods: ['filter', 'map', 'sort'] }],
    indent: 2,
  }],
}
```

## Autofix

The whitespace fix aligns each dot or optional-chain operator on a new line. Computed methods, comments between links, and unexpected link syntax are reported without a fix.

## Preset

Not enabled by the preset.

## Related

- [`arch/call-array-multiline`](./call-array-multiline.md)
- [`arch/call-arguments-multiline`](./call-arguments-multiline.md)
