# Tailwind and shadcn

Class-name checks on web roots. Back to the [preset overview](README.md). Options: [React, Tailwind and shadcn](options.md#react-tailwind-and-shadcn).

## Tailwind

`oxlint-tailwindcss` checks canonical names, order, shorthand, conflicts, duplicates, deprecated classes and whitespace.

- Declare custom utilities in the CSS entry point (or its imports). Conflicts with their properties are still reported.
- The plugin caches the compiled theme on disk; the first run is slower. Set `OXLINT_TAILWINDCSS_CACHE_DIR` to move the cache.
- Oxlint 1.85: overlapping fixes on one class string can need a second `--fix` run.

Migrating overrides from `better-tailwindcss/*` to `tailwindcss/*`:

| Old | New |
| --- | --- |
| `enforce-canonical-classes` | `enforce-canonical` |
| `enforce-consistent-class-order` | `enforce-sort-order` |
| `enforce-shorthand-classes` | `enforce-shorthand` |
| other rules | same suffix |

## shadcn restyling

Callers may add only `layout`, `opacity` and `truncate` classes to shadcn components:

```tsx
<Button className="w-full opacity-80" />   // ✅
<Button className="px-6 gap-2" />          // ❌ restyles the control
```

Composition slots also allow spacing:

| Components | Extra groups |
| --- | --- |
| `CardContent`, `PopoverContent` | `p`, `px`, `py`, `ps`, `pe`, `pt`, `pr`, `pb`, `pl` |
| `TabsContent` | padding groups + `gap`, `gap-x`, `gap-y` |
| `Tabs`, `HoverCardContent`, `SidebarHeader`, `BreadcrumbList` | `gap`, `gap-x`, `gap-y` |

- Exact component names only.
- A contract's `allow` replaces the baseline; the last matching contract wins.
- File-specific native options replace contract arrays; they do not merge.

## Arbitrary values

Allowed: `layout` and safe-area padding.

```tsx
<div className="pt-[env(safe-area-inset-top)]" />                      // ✅
<div className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]" /> // ✅ sides/axes only, not p
<div className="pb-[max(1rem,env(safe-area-inset-bottom))]" />         // ❌ literal floor
<div className="text-[#3b82f6]" />                                      // ❌ use a theme colour
```

These are class globs, not CSS validation.

## Illustrations

Artwork goes in `*.illustration.tsx` (`hero-card.illustration.tsx` exports `HeroCard` or `HeroCardIllustration`).

- Free palette: arbitrary colours, shadows, gradients, background size/position, masks, blur, fill, stroke.
- Still on the theme scale: type size, tracking, leading, radius, spacing. Add tokens to the CSS entry point.
- `components/ui` stays exempt; component contracts still apply.

## UI kit

- The kit is `<web source>/components/ui/**` by default. Set `shadcn.ui` to move it: a workspace package name (`'@app/ui'` → `packages/ui/src/**`) or a tsconfig `paths` alias (`'@/kit'` with `"@/*": ["./src/*"]` in a root's `tsconfig.json` → `<root>/src/kit/**`). A value that resolves to nothing throws.
- Kit files stay linted (type safety, formatting, layout) with architecture/appearance exceptions.
- A kit outside every web root gets the Tailwind checks. Its stylesheet is `tailwind.cssEntryPointsByRoot` for the kit's package folder (`packages/ui`) or its architecture root (`packages`); otherwise the stylesheet all web roots share. With several web stylesheets and no entry, the preset throws.
- Only the kit's `sonner.tsx` in a web root may use the Sonner `toaster` and `toast` classes.
