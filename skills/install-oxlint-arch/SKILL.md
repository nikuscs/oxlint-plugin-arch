---
name: install-oxlint-arch
description: Install oxlint-plugin-arch from npm, or vendor a local copy, and register it in the current repository's Oxlint config.
---

# Install oxlint-plugin-arch

Prefer the published package. Vendor a local copy only when the user wants to inspect or fork the rules in-tree.

## Procedure

1. Inspect the target repository:
   - Read its agent instructions and `git status`.
   - Identify its package manager and Oxlint configuration.
   - Look for an existing `oxlint-plugin-arch` dependency or vendored architecture plugin.

2. Install from npm with the repository's existing package manager, unless the user asked to vendor:

   ```bash
   bun add -d oxlint-plugin-arch oxlint @oxlint/plugins
   ```

   Use matching `oxlint` and `@oxlint/plugins` versions. Do not change package managers or unrelated dependency ranges.

3. Register the package in `jsPlugins` using plugin name `arch` and specifier `oxlint-plugin-arch`. Keep all repository paths and policy in the consumer's config.

4. Vendor only if the user asked for a local fork. Copy with:

   ```bash
   bun <skill-directory>/scripts/install.ts
   bun <skill-directory>/scripts/install.ts packages/tooling/src/oxlint/arch
   bun <skill-directory>/scripts/install.ts --target tools/lint/arch
   ```

   The fallback destination is `tools/oxlint/arch`. The installer refuses to replace an existing destination unless `--force` is supplied after review. Point `jsPlugins[].specifier` at the copied `index.ts` instead of the package name.

5. Enable only rules whose intended globs and options are confirmed with the user. Architecture rules are deliberately configurable and do not have a universal all-rules preset.

6. Run the repository's lint command and typecheck. Report the install path or package version, config changes, enabled rules, and any findings. Do not suppress or weaken findings without approval.
