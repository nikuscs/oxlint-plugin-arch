import type { OxlintConfig } from 'oxlint'
import type { PresetOptions } from '../types/preset.types.ts'
import { presetSourceConfig } from '../configs/source.ts'
import { presetTypesConfig } from '../configs/types.ts'
import { presetModulesConfig } from '../configs/modules.ts'
import { presetTestsConfig } from '../configs/tests.ts'
import { presetReactConfig } from '../configs/react.ts'
import { presetBoundariesConfig } from '../configs/boundaries.ts'
import { presetPluginsConfig } from '../configs/plugins.ts'
import { presetResolveContext } from '../services/preset-context.ts'
import { presetCompose } from '../services/preset-compose.ts'

export default function tanstackStartReactModulesPreset(
  options: PresetOptions = {},
): OxlintConfig {
  const context = presetResolveContext(options)

  return presetCompose(
    context,
    {
      ...presetSourceConfig(context),
      ...presetTypesConfig(context),
      ...presetModulesConfig(context),
      ...presetTestsConfig(context),
      ...presetReactConfig(context),
      ...presetBoundariesConfig(context),
    },
    presetPluginsConfig(context),
  )
}
