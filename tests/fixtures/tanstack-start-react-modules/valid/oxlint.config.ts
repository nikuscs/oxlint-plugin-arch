import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: { runner: 'apps/runner' },
  publicApi: ['apps/server/src/rpc/public/**/*.ts'],
  exclude: { 'no-console': ['packages/logger/src/index.ts'] },
  aliases: { '@backend': 'apps/server/src' },
});
