import { describe, it } from 'vitest'
import { reactDynamicClasses } from '../../../src/rules/react/react-dynamic-classes.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/react-dynamic-classes', () => {
  it.each([
    { name: 'static class passes', code: '<button className="btn-lg" />' },
    { name: 'static template passes', code: '<button className={`btn-lg`} />' },
    { name: 'conditional complete classes pass', code: '<button className={size === "lg" ? "btn-lg" : "btn-sm"} />' },
    { name: 'class helper passes', code: '<button className={clsx("btn", active && "btn-active")} />' },
    { name: 'other attributes are ignored', code: '<button id={"btn-" + size} />' },
    {
      name: 'template outside JSX is ignored',
      code: `function buttonClass(size) {
  const className = \`btn-\${size}\`
  return className
}`,
    },
    {
      name: 'interpolated class fails',
      code: `function Button() {
  const size = getSize()
  return <button className={\`btn-\${size}\`} />
}`,
      errors: ['forbidden'],
    },
    { name: 'concatenated class fails', code: '<button className={"btn-" + size} />', errors: ['forbidden'] },
    { name: 'nested concatenation fails', code: '<button className={clsx("btn-" + size)} />', errors: ['forbidden'] },
    {
      name: 'custom message is reported',
      code: '<button className={"btn-" + size} />',
      options: { message: 'Use complete classes.' },
      errors: ['Use complete classes.'],
    },
  ])('$name', (row) => testerRun(reactDynamicClasses, row))
})
