import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { filesComponentsOnly } from './files-components-only.ts'

describe('arch/files-components-only', () => {
  it.each([
    { name: 'a matching component passes', filename: 'user-card.tsx', code: 'export function UserCard() { return <div /> }' },
    {
      name: 'a type beside a component passes',
      filename: 'user-card.tsx',
      code: 'export type UserCardProps = { name: string }\nexport function UserCard() { return <div /> }',
    },
    {
      name: 'type specifiers pass',
      filename: 'user-card.tsx',
      code: `type Mode = 'compact'
export { type Mode }
export type * from './types'
export function UserCard() { return <div /> }`,
    },
    {
      name: 'prefixed components pass',
      filename: 'user-card.tsx',
      code: 'export function UserCardHeader() { return <div /> }\nexport function UserCardBody() { return <div /> }',
    },
    {
      name: 'the exact name allows other components',
      filename: 'user-card.tsx',
      code: 'export function UserCard() { return <div /> }\nexport function Avatar() { return <img /> }',
    },
    {
      name: 'memo, forwardRef and lazy wrappers pass',
      filename: 'user-card.tsx',
      code: `import { forwardRef, lazy, memo } from 'react'
export const UserCard = memo(() => <div />)
export const UserCardRef = forwardRef(() => <div />)
export const UserCardLazy = lazy(async () => import('./x'))`,
    },
    {
      name: 'a component from a local create function passes',
      filename: 'user-card.tsx',
      code: 'function createUserCard() { function UserCard() { return <div /> } return UserCard }\nconst UserCard = createUserCard()\nexport { UserCard }',
    },
    {
      name: 'a PropsWithChildren component passes',
      filename: 'panel.tsx',
      code: "import type { PropsWithChildren } from 'react'\nexport function Panel({ children }: PropsWithChildren) { return children }",
    },
    { name: 'a component returning null passes', filename: 'user-card.tsx', code: 'export function UserCard() { return null }' },
    { name: 'a role is dropped from the name', filename: 'user.view.tsx', code: 'export function User() { return <div /> }', options: { roles: ['view'] } },
    {
      name: 'the full name passes with a role',
      filename: 'user.view.tsx',
      code: 'export function UserView() { return <div /> }',
      options: { roles: ['view'] },
    },
    { name: 'any name passes without filename', filename: 'user-card.tsx', code: 'export function Avatar() { return <img /> }', options: { filename: false } },
    {
      name: 'a type outside deny passes',
      filename: 'user-card.tsx',
      code: "export type UserCardMode = 'compact'\nexport function UserCard() { return <div /> }",
      options: { deny: 'Props$' },
    },
    {
      name: 'an illustration role passes',
      filename: '/repo/components/services/services-search.illustration.tsx',
      code: 'export function ServicesSearch() { return <div /> }',
      options: { roles: ['illustration'] },
    },
    {
      name: 'a props interface beside its component passes',
      filename: '/repo/components/button/button-loading.tsx',
      code: 'export interface ButtonLoadingProps { label: string }\nexport function ButtonLoading({ label }: ButtonLoadingProps) { return <button>{label}</button> }',
    },
    {
      name: 'wrappers beside the exact component pass',
      filename: '/repo/components/example/example-card.tsx',
      code: "import { forwardRef, lazy, memo } from 'react'\nexport function ExampleCard() { return <div /> }\nexport const ExampleCardMemo = memo(() => <div />)\nexport const ExampleCardForwardRef = forwardRef(() => <div />)\nexport const ExampleCardLazy = lazy(async () => ({ default: ExampleCard }))",
    },
    {
      name: 'a local factory and a companion component pass',
      filename: '/repo/components/example/example-heading.tsx',
      code: 'function createExampleHeading() { function ExampleHeading() { return <h2 /> } return ExampleHeading }\nconst ExampleHeading = createExampleHeading()\nfunction ExampleHeadingLink() { return <a /> }\nexport { ExampleHeading, ExampleHeadingLink }',
    },
    {
      name: 'a body returning children passes',
      filename: '/repo/components/panel/panel-body.tsx',
      code: "import type { PropsWithChildren } from 'react'\nexport function PanelBody({ children }: PropsWithChildren) { return children }",
    },
    {
      name: 'a compound filename and its chart component pass',
      filename: '/repo/src/components/admin/insights/admin-insights-foo.tsx',
      code: 'export function AdminInsightsFoo() { return <div /> }\nexport function AdminInsightsFooChart() { return <div /> }',
    },
    {
      name: 'an exported mode alias passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
    },
    {
      name: 'a local type export passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'type ExampleCardMode = "compact"\nexport type { ExampleCardMode }\nexport function ExampleCard() { return <div /> }',
    },
    {
      name: 'a named type re-export passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type { ExampleCardMode } from "./types"\nexport function ExampleCard() { return <div /> }',
    },
    {
      name: 'an inline type export specifier passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'type ExampleCardMode = "compact"\nexport { type ExampleCardMode }\nexport function ExampleCard() { return <div /> }',
    },
    {
      name: 'a star type re-export passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type * from "./types"\nexport function ExampleCard() { return <div /> }',
    },
    {
      name: 'a mode alias outside the denied suffix passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
      options: { deny: 'Props$' },
    },
    {
      name: 'a component alone with types disabled passes',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export function ExampleCard() { return <div /> }',
      options: { types: false },
    },
    { name: 'a non-component export', filename: 'user-card.tsx', code: 'export const formatName = (name: string) => name.trim()', errors: ['nonComponent'] },
    { name: 'a PascalCase function without JSX', filename: 'user-card.tsx', code: 'export function UserCard() { return 1 }', errors: ['nonComponent'] },
    { name: 'an object of components', filename: 'user-card.tsx', code: 'export const userCardParts = { div: () => <div /> }', errors: ['nonComponent'] },
    { name: 'a name off the file name', filename: 'user-card.tsx', code: 'export function Avatar() { return <img /> }', errors: ['nameMismatch'] },
    { name: 'the role stays without roles', filename: 'user.view.tsx', code: 'export function User() { return <div /> }', errors: ['nameMismatch'] },
    {
      name: 'one report per mismatched component',
      filename: 'user-card.tsx',
      code: 'export function Avatar() { return <img /> }\nexport function Badge() { return <span /> }',
      errors: ['nameMismatch', 'nameMismatch'],
    },
    {
      name: 'a type alias without types',
      filename: 'user-card.tsx',
      code: "export type UserCardMode = 'compact'\nexport function UserCard() { return <div /> }",
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a type specifier without types',
      filename: 'user-card.tsx',
      code: "type UserCardMode = 'compact'\nexport { type UserCardMode }\nexport function UserCard() { return <div /> }",
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a type re-export without types',
      filename: 'user-card.tsx',
      code: "export type * from './types'\nexport function UserCard() { return <div /> }",
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a denied type',
      filename: 'user-card.tsx',
      code: "export interface UserCardProps { name: string }\nexport type UserCardMode = 'compact'\nexport function UserCard() { return <div /> }",
      options: { deny: 'Props$' },
      errors: ['deniedType'],
    },
    {
      name: 'a deny list',
      filename: 'user-card.tsx',
      code: "export type { UserCardProps } from './types'\nexport function UserCard() { return <div /> }",
      options: { deny: ['State$', 'Props$'] },
      errors: ['deniedType'],
    },
    {
      name: 'an illustration suffix without a role',
      filename: '/repo/components/services/services-search.illustration.tsx',
      code: 'export function ServicesSearch() { return <div /> }',
      errors: ['nameMismatch'],
    },
    {
      name: 'an exported component map',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export const exampleComponents = { div: () => <div /> }',
      errors: ['nonComponent'],
    },
    {
      name: 'a matching component name returning a number',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export function ExampleCard() { return 1 }',
      errors: ['nonComponent'],
    },
    {
      name: 'a component named for another card',
      filename: '/repo/components/other/other-card.tsx',
      code: 'export function ExampleCard() { return <div /> }',
      errors: ['nameMismatch'],
    },
    {
      name: 'a component missing compound filename prefixes',
      filename: '/repo/src/components/admin/insights/admin-insights-foo.tsx',
      code: 'export function Foo() { return <div /> }',
      errors: ['nameMismatch'],
    },
    {
      name: 'an exported mode alias with types disabled',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a props interface with types disabled',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export interface ExampleCardProps { label: string }\nexport function ExampleCard() { return <div /> }',
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a local interface export with types disabled',
      filename: '/repo/components/example/example-card.tsx',
      code: 'interface ExampleCardProps { label: string }\nexport type { ExampleCardProps }\nexport function ExampleCard() { return <div /> }',
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a named type re-export with types disabled',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type { ExampleCardMode } from "./types"\nexport function ExampleCard() { return <div /> }',
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'an inline type specifier with types disabled',
      filename: '/repo/components/example/example-card.tsx',
      code: 'type ExampleCardMode = "compact"\nexport { type ExampleCardMode }\nexport function ExampleCard() { return <div /> }',
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a star type re-export with types disabled',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type * from "./types"\nexport function ExampleCard() { return <div /> }',
      options: { types: false },
      errors: ['typeExport'],
    },
    {
      name: 'a denied props interface beside an allowed mode',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export interface ExampleCardProps { label: string }\nexport type ExampleCardMode = "compact"\nexport function ExampleCard() { return <div /> }',
      options: { deny: 'Props$' },
      errors: ['deniedType'],
    },
    {
      name: 'a props interface matching a deny list',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export interface ExampleCardProps { label: string }\nexport function ExampleCard() { return <div /> }',
      options: { deny: ['State$', 'Props$'] },
      errors: ['deniedType'],
    },
    {
      name: 'a denied local interface export',
      filename: '/repo/components/example/example-card.tsx',
      code: 'interface ExampleCardProps { label: string }\nexport type { ExampleCardProps }\nexport function ExampleCard() { return <div /> }',
      options: { deny: 'Props$' },
      errors: ['deniedType'],
    },
    {
      name: 'a denied named type re-export',
      filename: '/repo/components/example/example-card.tsx',
      code: 'export type { ExampleCardProps } from "./types"\nexport function ExampleCard() { return <div /> }',
      options: { deny: 'Props$' },
      errors: ['deniedType'],
    },
  ])('$name', (row) => testerRun(filesComponentsOnly, row))
})
