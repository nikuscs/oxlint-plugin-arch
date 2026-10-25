import { preset, recipes } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    '.': recipes.tanstack,
  },
})
