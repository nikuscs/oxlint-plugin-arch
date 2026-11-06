# arch/layout-pipe

No `).pipe(` after a call that spans lines, and no multi-line call passed to a pipe step. A step may still span lines through a callback, object or array.

```ts
// ❌
load({
  id,
}).pipe(retry(schedule({
  times,
})))

// ✅
const user = load({
  id,
})
const policy = schedule({
  times,
})
user.pipe(retry(policy))
```

No options.

```ts
'arch/layout-pipe': 'error'
```
