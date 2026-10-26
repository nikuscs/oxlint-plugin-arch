import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noModuleMockingRule } from './no-module-mocking.ts'

describe('dillon-anti-slop/no-module-mocking', () => {
  it.each([
    { name: 'injected dependencies pass', code: 'const mailer = createMemoryMailer(); const service = createSignupService({ mailer })' },
    { name: 'function doubles pass by default', code: 'vi.fn()' },
    { name: 'a shadowed framework passes', code: 'function run(vi: Client) { vi.mock() }' },
    { name: 'an allowed API overrides deny', code: "vi.mock('./mailer')", options: { allow: ['vi.mock'] } },
    { name: 'destructured calls pass by default', code: "const { mock } = vi; mock('./mailer')" },
    { name: 'default-allowed doubles pass', code: "const send = vi.fn()\nvi.spyOn(mailer, 'send')\nvi.stubGlobal('fetch', fetch)\nvi.stubEnv('MODE', 'test')" },
    { name: 'a Jest spy passes by default', code: "jest.spyOn(mailer, 'send')" },
    { name: 'a local object named vi passes', code: "const vi = { mock() {} }\nvi.mock('./mailer')" },
    { name: 'a vi imported from a local module passes', code: "import { vi } from './local'\nvi.mock('./mailer')" },
    { name: 'an unknown object passes', code: "other.mock('./mailer')" },
    { name: 'a computed key with a dot passes', code: 'vi["mock.cached"]()' },
    {
      name: 'an allowed function double passes',
      code: 'const send = vi.fn()',
      options: { deny: ['*.fn'], allow: ['*.fn'] },
    },
    { name: 'an API outside the deny list passes', code: "vi.useFakeTimers()\nvi.mock('./mailer')", options: { deny: ['*.spyOn'] } },
    {
      name: 'an exact allow overrides a wildcard deny',
      code: "vi.stubGlobal('fetch', fetch)",
      options: { deny: ['*.stubGlobal'], allow: ['vi.stubGlobal'] },
    },
    {
      name: 'a wildcard allow overrides every deny',
      code: "vi.mock('./mailer')\njest.spyOn(mailer, 'send')",
      options: { deny: ['*.mock', '*.spyOn'], allow: ['*'] },
    },
    {
      name: 'an allowed destructured double passes',
      code: 'const { fn } = vi\nconst send = fn()',
      options: { deny: ['*.fn'], allow: ['*.fn'], checkDestructured: true },
    },
    {
      name: 'a destructure from an unknown object passes',
      code: "const { spyOn } = local\nspyOn(mailer, 'send')",
      options: { deny: ['*.spyOn'], checkDestructured: true },
    },
    {
      name: 'a destructure from a local vi passes',
      code: "const vi = { spyOn() {} }\nconst { spyOn } = vi\nspyOn(mailer, 'send')",
      options: { deny: ['*.spyOn'], checkDestructured: true },
    },
    {
      name: 'a reassigned destructured mock passes',
      code: "let { mock } = vi\nmock = () => {}\nmock('./mailer')",
      options: { deny: ['*.mock'], checkDestructured: true },
    },
    {
      name: 'a redeclared destructured mock passes',
      code: "var { mock } = vi\nvar mock = () => {}\nmock('./mailer')",
      options: { deny: ['*.mock'], checkDestructured: true },
    },
    { name: 'a module mock fails', code: "vi.mock('./mailer')", errors: ['moduleMock'] },
    { name: 'a Jest mock fails', code: "jest.doMock('./mailer')", errors: ['moduleMock'] },
    { name: 'an imported alias fails', code: "import { vi as testing } from 'vitest'; testing.mock('./mailer')", errors: ['moduleMock'] },
    { name: 'a denied double fails', code: "vi.spyOn(mailer, 'send')", options: { deny: ['*.spyOn'] }, errors: ['testDouble'] },
    {
      name: 'a custom message is selected',
      code: "vi.spyOn(mailer, 'send')",
      options: { deny: [{ api: 'vi.spyOn', message: 'Pass a fake instead.' }] },
      errors: ['Pass a fake instead.'],
    },
    { name: 'destructured calls can be checked', code: "const { mock } = vi; mock('./mailer')", options: { checkDestructured: true }, errors: ['moduleMock'] },
    { name: 'a computed module mock key', code: "vi['unstable_mockModule']('./mailer')", errors: ['moduleMock'] },
    { name: 'an imported Jest global', code: "import { jest } from '@jest/globals'\njest.mock('./mailer')", errors: ['moduleMock'] },
    {
      name: 'custom messages across frameworks',
      code: "import { vi as mocks } from 'vitest'\nmocks.stubGlobal('fetch', fetch)\njest.stubEnv('MODE', 'test')\nvi.mock('./mailer')",
      options: { deny: [{ api: '*.stubGlobal', message: 'Inject a fake driver.' }, { api: '*.stubEnv', message: 'Inject a fake driver.' }, { api: '*.mock', message: 'Inject a fake driver.' }] },
      errors: ['Inject a fake driver.', 'Inject a fake driver.', 'Inject a fake driver.'],
    },
    {
      name: 'a computed spy key with a custom message',
      code: "vi['spyOn'](mailer, 'send')",
      options: { deny: [{ api: '*.spyOn', message: 'Inject a fake driver.' }] },
      errors: ['Inject a fake driver.'],
    },
    {
      name: 'a framework wildcard deny',
      code: 'vi.useFakeTimers()\nconst send = vi.fn()\njest.useFakeTimers()',
      options: { deny: ['vi.*'], allow: ['*.fn'] },
      errors: ['testDouble'],
    },
    {
      name: 'an exact allow on one framework only',
      code: "vi.stubGlobal('fetch', fetch)\njest.stubGlobal('fetch', fetch)\nvi.spyOn(mailer, 'send')",
      options: { deny: [{ api: '*.stubGlobal', message: 'Inject a fake driver.' }, { api: '*.spyOn', message: 'Inject a fake driver.' }], allow: ['vi.stubGlobal'] },
      errors: ['Inject a fake driver.', 'Inject a fake driver.'],
    },
    { name: 'a deny-all wildcard on a dotted key', code: 'vi["mock.cached"]()', options: { deny: ['*'] }, errors: ['testDouble'] },
    {
      name: 'destructured calls with custom messages',
      code: "const { mock, spyOn } = vi\nmock('./mailer')\nspyOn(mailer, 'send')",
      options: { deny: [{ api: '*.mock', message: 'Inject a fake driver.' }, { api: '*.spyOn', message: 'Inject a fake driver.' }], checkDestructured: true },
      errors: ['Inject a fake driver.', 'Inject a fake driver.'],
    },
    {
      name: 'renamed and computed destructured keys',
      code: "import { vi } from 'vitest'\nconst { spyOn: spy, ['stubEnv']: stub, 'stubGlobal': global } = vi\nspy(mailer, 'send')\nstub('MODE', 'test')\nglobal('fetch', fetch)",
      options: { deny: [{ api: '*.spyOn', message: 'Inject a fake driver.' }, { api: '*.stubEnv', message: 'Inject a fake driver.' }, { api: '*.stubGlobal', message: 'Inject a fake driver.' }], checkDestructured: true },
      errors: ['Inject a fake driver.', 'Inject a fake driver.', 'Inject a fake driver.'],
    },
    {
      name: 'a destructured Jest module mock',
      code: "const { doMock } = jest\ndoMock('./mailer')",
      options: { checkDestructured: true },
      errors: ['moduleMock'],
    },
  ])('$name', (row) => testerRun(noModuleMockingRule, row))
})
