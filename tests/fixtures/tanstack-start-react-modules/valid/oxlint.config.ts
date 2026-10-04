import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: { 'apps/web': 'web', 'apps/server': 'server', 'apps/runner': 'runner', packages: 'packages', scripts: 'scripts' },
  publicApi: ['apps/server/src/rpc/public/**/*.ts'],
  exclude: { 'no-console': ['packages/logger/src/index.ts'] },
  aliases: { '@backend': 'apps/server/src' },
});
