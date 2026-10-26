import { describe, it } from 'vitest'
import { reactProps } from '../../../src/rules/react/react-props.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/react-props', () => {
  it.each([
    {
      name: 'adjacent named interface passes',
      code: 'interface ButtonProps { label: string }\nexport function Button({ label }: ButtonProps) { return <button>{label}</button> }',
    },
    {
      name: 'exported interface and default component pass',
      code: 'export interface ButtonProps { label: string }\nexport default function Button(props: ButtonProps) { return <button>{props.label}</button> }',
    },
    {
      name: 'blank lines preserve adjacency',
      code: 'interface ButtonProps { label: string }\n\nexport const Button = (props: ButtonProps) => <button>{props.label}</button>',
    },
    { name: 'parameterless component passes', code: 'export function Button() { return <button /> }' },
    { name: 'noncomponent functions are ignored', code: 'export function Format(input: { id: string }) { return input.id }' },
    {
      name: 'generic interface passes',
      code: 'interface ListProps<T> { items: T[] }\nexport function List<T>({ items }: ListProps<T>) { return <ul>{items.length}</ul> }',
    },
    { name: 'intrinsic props pass through', code: "export function Button(props: ComponentProps<'button'>) { return <button {...props} /> }" },
    { name: 'component props pass through', code: 'export function Button(props: React.ComponentProps<typeof Base>) { return <Base {...props} /> }' },
    {
      name: 'memo wrapper uses the adjacent interface',
      code: 'interface ButtonProps { label: string }\nexport const Button = memo((props: ButtonProps) => <button>{props.label}</button>)',
    },
    {
      name: 'forwardRef type argument supplies props',
      code: 'interface ButtonProps { label: string }\nexport const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => <button ref={ref}>{props.label}</button>)',
    },
    {
      name: 'local component may omit file prefix by default',
      filename: 'card.tsx',
      code: 'interface BadgeProps { label: string }\nfunction Badge(props: BadgeProps) { return <i>{props.label}</i> }',
    },
    {
      name: 'prefixed local component passes',
      filename: 'card.tsx',
      code: 'interface CardBadgeProps { label: string }\nfunction CardBadge(props: CardBadgeProps) { return <i>{props.label}</i> }',
      options: { prefix: true },
    },
    {
      name: 'exported component is exempt from file prefix',
      filename: 'card.tsx',
      code: 'interface BadgeProps { label: string }\nfunction Badge(props: BadgeProps) { return <i>{props.label}</i> }\nexport { Badge }',
      options: { prefix: true },
    },
    {
      name: 'an unprefixed parameterless local passes',
      filename: '/repo/src/components/probe/probe-card.tsx',
      code: 'export function ProbeCard() { return <div /> }\nfunction Badge() { return <i /> }',
      options: { prefix: true },
    },
    { name: 'hooks are ignored', filename: '/repo/src/hooks/use-probe.ts', code: 'export function useProbe({ id }: { id: string }) { return id }' },
    {
      name: 'lowercase functions and inline handlers are ignored',
      filename: '/repo/src/components/probe/probe-card.tsx',
      code: 'export function formatProbe(input: { id: string }) { return input.id }\nexport function Format(input: { id: string }) { return input.id }\nexport function ProbeCard() { return <button onClick={(event: { x: number }) => event.x} /> }',
    },
    { name: 'inline props fail', code: 'export function Button({ label }: { label: string }) { return <button>{label}</button> }', errors: ['inline'] },
    {
      name: 'defaulted inline props fail',
      code: 'export const Button = ({ label = "x" }: { label?: string } = {}) => <button>{label}</button>',
      errors: ['inline'],
    },
    {
      name: 'nested inline intersection fails',
      code: 'export function Button(props: BaseProps & { label: string }) { return <button>{props.label}</button> }',
      errors: ['inline'],
    },
    {
      name: 'forwardRef inline type argument fails',
      code: 'export const Button = forwardRef<HTMLButtonElement, { label: string }>((props, ref) => <button ref={ref}>{props.label}</button>)',
      errors: ['inline'],
    },
    { name: 'untyped props fail', code: 'export function Button(props) { return <button>{props.label}</button> }', errors: ['name'] },
    {
      name: 'wrong interface name fails',
      code: 'interface Options { label: string }\nexport function Button(props: Options) { return <button>{props.label}</button> }',
      errors: ['name'],
    },
    {
      name: 'type alias is not an interface',
      code: 'type ButtonProps = { label: string }\nexport function Button(props: ButtonProps) { return <button>{props.label}</button> }',
      errors: ['name'],
    },
    {
      name: 'wrapped pass-through type fails',
      code: "export function Button(props: Omit<ComponentProps<'button'>, 'type'>) { return <button {...props} /> }",
      errors: ['name'],
    },
    {
      name: 'intervening statement fails',
      code: 'interface ButtonProps { label: string }\nconst size = 1\nexport function Button(props: ButtonProps) { return <button>{props.label}</button> }',
      errors: ['placement'],
    },
    {
      name: 'intervening comment fails',
      code: 'interface ButtonProps { label: string }\n// Button label.\nexport function Button(props: ButtonProps) { return <button>{props.label}</button> }',
      errors: ['placement'],
    },
    {
      name: 'interface after the component fails',
      code: 'export function Button(props: ButtonProps) { return <button>{props.label}</button> }\ninterface ButtonProps { label: string }',
      errors: ['placement'],
    },
    {
      name: 'unprefixed local component fails',
      filename: 'card.tsx',
      code: 'interface BadgeProps { label: string }\nfunction Badge(props: BadgeProps) { return <i>{props.label}</i> }',
      options: { prefix: true },
      errors: ['rename'],
    },
    {
      name: 'prefix error takes precedence over inline props',
      filename: 'card.tsx',
      code: 'function Badge(props: { label: string }) { return <i>{props.label}</i> }',
      options: { prefix: true },
      errors: ['rename'],
    },
    {
      name: 'aliases and wrapped pass-through types',
      filename: '/repo/src/components/probe/probe-card.tsx',
      code: "import type { ComponentProps, PropsWithChildren } from 'react'\ntype ProbeCardProps = { title: string }\nexport function ProbeCard({ title }: ProbeCardProps) { return <h2>{title}</h2> }\nexport function ProbeCardButton(props: Omit<ComponentProps<'button'>, 'type'>) { return <button {...props} /> }\nexport function ProbeCardHeader(props: ComponentProps<'header'> & ProbeCardHeaderProps) { return <header {...props} /> }\ninterface ProbeCardPanelProps { title: string }\nexport function ProbeCardPanel({ children }: PropsWithChildren<ProbeCardPanelProps>) { return <div>{children}</div> }",
      errors: ['name', 'name', 'name', 'name'],
    },
    {
      name: 'inline wrapper types and an untyped forwardRef',
      filename: '/repo/src/components/probe/probe-card.tsx',
      code: "import { forwardRef, memo } from 'react'\nexport const ProbeCard = forwardRef<HTMLDivElement, { title: string }>((props, ref) => <div ref={ref}>{props.title}</div>)\nexport const ProbeCardMemo = memo(({ title }: { title: string }) => <p>{title}</p>)\nexport const ProbeCardRef = forwardRef((props, ref) => <div ref={ref} />)",
      errors: ['inline', 'inline', 'name'],
    },
    {
      name: 'interfaces grouped above components',
      filename: '/repo/src/components/probe/probe-card.tsx',
      code: 'interface ProbeCardProps { title: string }\ninterface ProbeCardInlineProps { label: string }\nexport function ProbeCard({ title }: ProbeCardProps) { return <h2>{title}</h2> }\nexport function ProbeCardInline({ label }: ProbeCardInlineProps) { return <p>{label}</p> }',
      errors: ['placement', 'placement'],
    },
    {
      name: 'singularizing the file stem and omitting its prefix both fail',
      filename: '/repo/src/components/rooms/rooms-chat-tools.tsx',
      code: 'interface RoomsChatToolProps { label: string }\nfunction RoomsChatTool({ label }: RoomsChatToolProps) { return <li>{label}</li> }\nfunction Badge({ tone }: { tone: string }) { return <i>{tone}</i> }\nexport function RoomsChatTools() { return <ul><RoomsChatTool label="x" /><Badge tone="y" /></ul> }',
      options: { prefix: true },
      errors: ['rename', 'rename'],
    },
  ])('$name', (row) => testerRun(reactProps, row))
})
