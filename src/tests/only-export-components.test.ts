import { test } from 'vitest'
import { onlyExportComponents } from '../rules/only-export-components.ts'
import { createRuleTester } from './rule-tester.ts'

const nonComponent = { messageId: 'nonComponent' }
const nameMismatch = { messageId: 'nameMismatch' }
const typeExport = { messageId: 'typeExport' }
const deniedType = { messageId: 'deniedType' }
const denyTypes = [{ allowTypeExports: false }]
const denyProps = [{ denyTypePattern: 'Props$' }]

test('only-export-components', () => {
  createRuleTester('tsx').run('arch/only-export-components', onlyExportComponents, {
    valid: [
      {
        filename: '/repo/components/button/button-loading.tsx',
        code: 'export interface ButtonLoadingProps { label: string }\nexport function ButtonLoading({ label }: ButtonLoadingProps) { return <button>{label}</button> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: "import { forwardRef, lazy, memo } from 'react'\nexport function ExampleCard() { return <div /> }\nexport const ExampleCardMemo = memo(() => <div />)\nexport const ExampleCardForwardRef = forwardRef(() => <div />)\nexport const ExampleCardLazy = lazy(async () => ({ default: ExampleCard }))",
      },
      {
        filename: '/repo/components/example/example-heading.tsx',
        code: 'function createExampleHeading() { function ExampleHeading() { return <h2 /> } return ExampleHeading }\nconst ExampleHeading = createExampleHeading()\nfunction ExampleHeadingLink() { return <a /> }\nexport { ExampleHeading, ExampleHeadingLink }',
      },
      {
        filename: '/repo/components/panel/panel-body.tsx',
        code: "import type { PropsWithChildren } from 'react'\nexport function PanelBody({ children }: PropsWithChildren) { return children }",
      },
      {
        filename: '/repo/src/components/admin/insights/admin-insights-foo.tsx',
        code: 'export function AdminInsightsFoo() { return <div /> }\nexport function AdminInsightsFooChart() { return <div /> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'type ExampleCardMode = "compact"\nexport type { ExampleCardMode }\nexport function ExampleCard() { return <div /> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type { ExampleCardMode } from "./types"\nexport function ExampleCard() { return <div /> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'type ExampleCardMode = "compact"\nexport { type ExampleCardMode }\nexport function ExampleCard() { return <div /> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type * from "./types"\nexport function ExampleCard() { return <div /> }',
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
        options: denyProps,
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export function ExampleCard() { return <div /> }',
        options: denyTypes,
      },
    ],
    invalid: [
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export const exampleComponents = { div: () => <div /> }',
        errors: [nonComponent],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export function ExampleCard() { return 1 }',
        errors: [nonComponent],
      },
      {
        filename: '/repo/components/other/other-card.tsx',
        code: 'export function ExampleCard() { return <div /> }',
        errors: [nameMismatch],
      },
      {
        filename: '/repo/src/components/admin/insights/admin-insights-foo.tsx',
        code: 'export function Foo() { return <div /> }',
        errors: [nameMismatch],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
        options: denyTypes,
        errors: [typeExport],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export interface ExampleCardProps { label: string }\nexport function ExampleCard() { return <div /> }',
        options: denyTypes,
        errors: [typeExport],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'interface ExampleCardProps { label: string }\nexport type { ExampleCardProps }\nexport function ExampleCard() { return <div /> }',
        options: denyTypes,
        errors: [typeExport],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type { ExampleCardMode } from "./types"\nexport function ExampleCard() { return <div /> }',
        options: denyTypes,
        errors: [typeExport],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'type ExampleCardMode = "compact"\nexport { type ExampleCardMode }\nexport function ExampleCard() { return <div /> }',
        options: denyTypes,
        errors: [typeExport],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type * from "./types"\nexport function ExampleCard() { return <div /> }',
        options: denyTypes,
        errors: [typeExport],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export interface ExampleCardProps { label: string }\nexport type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
        options: denyProps,
        errors: [deniedType],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export interface ExampleCardProps { label: string }\nexport function ExampleCard() { return <div /> }',
        options: [{ denyTypePattern: ['State$', 'Props$'] }],
        errors: [deniedType],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'interface ExampleCardProps { label: string }\nexport type { ExampleCardProps }\nexport function ExampleCard() { return <div /> }',
        options: denyProps,
        errors: [deniedType],
      },
      {
        filename: '/repo/components/example/example-card.tsx',
        code: 'export type { ExampleCardProps } from "./types"\nexport function ExampleCard() { return <div /> }',
        options: denyProps,
        errors: [deniedType],
      },
    ],
  })
})
