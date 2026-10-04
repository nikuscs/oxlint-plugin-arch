import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: { 'apps/web': 'web', 'apps/server': 'server', 'apps/runner': 'runner', packages: 'packages', scripts: 'scripts' },
  publicApi: ['apps/server/src/rpc/public/**/*.ts'],
  level: 'warn',
  cli: ['apps/server/src/entry.cli.ts'],
  banTypes: false,
  comments: (current) => [
    ...current,
    {
      files: ['apps/server/src/portable/**/*.ts'],
      rules: { 'arch/no-comments': 'off' },
    },
  ],
  exclude: { 'no-console': ['packages/logger/src/index.ts'], 'modules/no-unknown': ['apps/server/src/portable/**/*.ts'] },
  ignorePatterns: ['apps/server/src/ignored/**'],
});
