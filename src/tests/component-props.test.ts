import { test } from 'vitest'
import { componentProps } from '../rules/component-props.ts'
import { createRuleTester } from './rule-tester.ts'

const filename = '/repo/src/components/probe/probe-card.tsx'
const filePrefix = [{ filePrefix: true }]
const props = (messageId: string, name: string, extra: Record<string, string> = {}) => ({
  messageId,
  data: { name, expected: `${name}Props`, ...extra },
})

test('component-props', () => {
  createRuleTester('tsx').run('arch/component-props', componentProps, {
    valid: [
      {
        filename,
        code: 'interface ProbeCardProps { title: string }\nexport function ProbeCard({ title }: ProbeCardProps) { return <h2>{title}</h2> }\n\n\nexport interface ProbeCardInlineProps { label?: string }\n\nexport const ProbeCardInline = ({ label = "x" }: ProbeCardInlineProps) => <span>{label}</span>',
      },
      {
        filename,
        code: 'export interface ProbeCardProps { title: string }\nexport default function ProbeCard(props: ProbeCardProps) { return <h2>{props.title}</h2> }',
      },
      { filename, code: 'export function ProbeCard() { return <div /> }\nfunction Badge() { return <i /> }', options: filePrefix },
      {
        filename,
        code: "import type { ReactNode } from 'react'\ninterface ProbeCardProps { children: ReactNode }\nexport function ProbeCard({ children }: ProbeCardProps) { return <div>{children}</div> }",
      },
      {
        filename,
        code: "import type { ComponentProps } from 'react'\ninterface ProbeCardProps extends Omit<ComponentProps<'button'>, 'type'> { tone: string }\nexport function ProbeCard({ tone, ...rest }: ProbeCardProps) { return <button {...rest} data-tone={tone} /> }",
      },
      {
        filename,
        code: 'interface ProbeCardProps<T> { items: T[] }\nexport function ProbeCard<T>({ items }: ProbeCardProps<T>) { return <ul>{items.length}</ul> }',
      },
      {
        filename,
        code: "import { forwardRef, memo } from 'react'\ninterface ProbeCardProps { title: string }\nexport const ProbeCard = forwardRef<HTMLDivElement, ProbeCardProps>((props, ref) => <div ref={ref}>{props.title}</div>)\ninterface ProbeCardMemoProps { title: string }\nexport const ProbeCardMemo = memo(function ProbeCardMemo({ title }: ProbeCardMemoProps) { return <p>{title}</p> })",
      },
      {
        filename,
        code: 'interface ProbeCardBadgeProps { tone: string }\nfunction ProbeCardBadge({ tone }: ProbeCardBadgeProps) { return <i>{tone}</i> }\nexport function ProbeCard() { return <ProbeCardBadge tone="x" /> }',
        options: filePrefix,
      },
      {
        filename,
        code: 'interface BadgeProps { tone: string }\nfunction Badge({ tone }: BadgeProps) { return <i>{tone}</i> }\nexport function ProbeCard() { return <Badge tone="x" /> }',
      },
      {
        filename,
        code: 'interface ProbeCardProps { title: string }\nfunction ProbeCard({ title }: ProbeCardProps) { return <h2>{title}</h2> }\nexport { ProbeCard }',
      },
      {
        filename,
        code: "import type { ComponentProps } from 'react'\nimport * as React from 'react'\nexport function ProbeCard(props: ComponentProps<'header'>) { return <header {...props} /> }\nexport function ProbeCardLink(props: React.ComponentProps<typeof ProbeCard>) { return <ProbeCard {...props} /> }",
        options: filePrefix,
      },
      {
        filename: '/repo/src/hooks/use-probe.ts',
        code: 'export function useProbe({ id }: { id: string }) { return id }',
      },
      {
        filename,
        code: 'export function formatProbe(input: { id: string }) { return input.id }\nexport function Format(input: { id: string }) { return input.id }\nexport function ProbeCard() { return <button onClick={(event: { x: number }) => event.x} /> }',
      },
    ],
    invalid: [
      {
        filename,
        code: 'export function ProbeCard({ title }: { title: string }) { return <h2>{title}</h2> }',
        errors: [props('inline', 'ProbeCard')],
      },
      {
        filename,
        code: 'export const ProbeCard = ({ title = "x" }: { title?: string } = {}) => <h2>{title}</h2>\nexport default function ProbeCardInline(props: ProbeCardInlineProps & { extra: string }) { return <p>{props.extra}</p> }\nfunction ProbeCardBadge({ tone }: { tone: string }) { return <i>{tone}</i> }',
        errors: [props('inline', 'ProbeCard'), props('inline', 'ProbeCardInline'), props('inline', 'ProbeCardBadge')],
      },
      {
        filename,
        code: 'interface ProbeCardOptions { title: string }\nexport function ProbeCard({ title }: ProbeCardOptions) { return <h2>{title}</h2> }\ninterface Props { title: string }\nexport function ProbeCardInline({ title }: Props) { return <h2>{title}</h2> }\ninterface OtherProps { title: string }\nfunction ProbeCardPanel({ title }: OtherProps) { return <h2>{title}</h2> }',
        errors: [
          props('name', 'ProbeCard', { actual: 'ProbeCardOptions' }),
          props('name', 'ProbeCardInline', { actual: 'Props' }),
          props('name', 'ProbeCardPanel', { actual: 'OtherProps' }),
        ],
      },
      {
        filename,
        code: "import type { ComponentProps, PropsWithChildren } from 'react'\ntype ProbeCardProps = { title: string }\nexport function ProbeCard({ title }: ProbeCardProps) { return <h2>{title}</h2> }\nexport function ProbeCardButton(props: Omit<ComponentProps<'button'>, 'type'>) { return <button {...props} /> }\nexport function ProbeCardHeader(props: ComponentProps<'header'> & ProbeCardHeaderProps) { return <header {...props} /> }\ninterface ProbeCardPanelProps { title: string }\nexport function ProbeCardPanel({ children }: PropsWithChildren<ProbeCardPanelProps>) { return <div>{children}</div> }",
        errors: [
          props('name', 'ProbeCard', { actual: 'ProbeCardProps' }),
          props('name', 'ProbeCardButton', { actual: "Omit<ComponentProps<'button'>, 'type'>" }),
          props('name', 'ProbeCardHeader', { actual: "ComponentProps<'header'> & ProbeCardHeaderProps" }),
          props('name', 'ProbeCardPanel', { actual: 'PropsWithChildren<ProbeCardPanelProps>' }),
        ],
      },
      {
        filename,
        code: "import { forwardRef, memo } from 'react'\nexport const ProbeCard = forwardRef<HTMLDivElement, { title: string }>((props, ref) => <div ref={ref}>{props.title}</div>)\nexport const ProbeCardMemo = memo(({ title }: { title: string }) => <p>{title}</p>)\nexport const ProbeCardRef = forwardRef((props, ref) => <div ref={ref} />)",
        errors: [props('inline', 'ProbeCard'), props('inline', 'ProbeCardMemo'), props('name', 'ProbeCardRef', { actual: 'untyped' })],
      },
      {
        filename,
        code: 'interface ProbeCardProps { title: string }\ninterface ProbeCardInlineProps { label: string }\nexport function ProbeCard({ title }: ProbeCardProps) { return <h2>{title}</h2> }\nexport function ProbeCardInline({ label }: ProbeCardInlineProps) { return <p>{label}</p> }',
        errors: [props('placement', 'ProbeCard'), props('placement', 'ProbeCardInline')],
      },
      {
        filename,
        code: "import { memo } from 'react'\nexport interface ProbeCardProps { title: string }\n// Card props.\nexport const ProbeCard = memo(({ title }: ProbeCardProps) => <h2>{title}</h2>)\nexport function ProbeCardInline({ label }: ProbeCardInlineProps) { return <p>{label}</p> }\ninterface ProbeCardInlineProps { label: string }",
        errors: [props('placement', 'ProbeCard'), props('placement', 'ProbeCardInline')],
      },
      {
        filename: '/repo/src/components/rooms/rooms-chat-tools.tsx',
        code: 'interface RoomsChatToolProps { label: string }\nfunction RoomsChatTool({ label }: RoomsChatToolProps) { return <li>{label}</li> }\nfunction Badge({ tone }: { tone: string }) { return <i>{tone}</i> }\nexport function RoomsChatTools() { return <ul><RoomsChatTool label="x" /><Badge tone="y" /></ul> }',
        options: filePrefix,
        errors: [
          props('rename', 'RoomsChatTool', { prefix: 'RoomsChatTools' }),
          props('rename', 'Badge', { prefix: 'RoomsChatTools' }),
        ],
      },
    ],
  })
})
