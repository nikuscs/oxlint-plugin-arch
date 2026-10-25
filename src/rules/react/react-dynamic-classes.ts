import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const reactDynamicClasses = syntaxRule(
  ':matches(JSXAttribute[name.name="className"] TemplateLiteral[expressions.length>0], JSXAttribute[name.name="className"] BinaryExpression[operator="+"])',
      'Write complete class names instead of constructing them dynamically.',
)
