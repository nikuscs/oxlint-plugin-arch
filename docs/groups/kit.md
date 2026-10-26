# 🧰 kit

Marks a folder as a UI kit: kit files are exempt like `components/ui`. Opt-in.

```ts
folders: {
  'packages/ui': { react: true, kit: true },
}
```

Takes `true` or `false`. Detected for a package with `react` and a `components/` folder (`recipes.ui`).
