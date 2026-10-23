import { expect, test } from 'vitest';
import { noModuleMockingRule } from '../rules/dillon-anti-slop/rules/no-module-mocking.ts';
import { createRuleTester } from './rule-tester.ts';

const strict = [
  {
    deny: ['*.mock', '*.doMock', '*.unstable_mockModule', '*.spyOn', '*.stubGlobal', '*.stubEnv'].map((api) => ({
      api,
      message: 'Inject a fake driver.',
    })),
    allow: ['*.fn'],
  },
];

test('no options ban only Vitest and Jest module mocking', () => {
  createRuleTester().run('dillon-anti-slop/no-module-mocking', noModuleMockingRule, {
    valid: [
      "const send = vi.fn()\nvi.spyOn(mailer, 'send')\nvi.stubGlobal('fetch', fetch)\nvi.stubEnv('MODE', 'test')",
      "jest.spyOn(mailer, 'send')",
      "const vi = { mock() {} }\nvi.mock('./mailer')",
      "import { vi } from './local'\nvi.mock('./mailer')",
      "other.mock('./mailer')",
      'vi["mock.cached"]()',
      "const { mock, spyOn } = vi\nmock('./mailer')\nspyOn(mailer, 'send')",
    ],
    invalid: [
      { code: "vi.mock('./mailer')", errors: [{ messageId: 'moduleMock' }] },
      { code: "jest.doMock('./mailer')", errors: [{ messageId: 'moduleMock' }] },
      { code: "vi['unstable_mockModule']('./mailer')", errors: [{ messageId: 'moduleMock' }] },
      {
        code: "import { vi as mocks } from 'vitest'\nmocks.mock('./mailer')",
        errors: [{ messageId: 'moduleMock' }],
      },
      {
        code: "import { jest } from '@jest/globals'\njest.mock('./mailer')",
        errors: [{ messageId: 'moduleMock' }],
      },
    ],
  });
});

test('deny bans extra APIs with the default or a configured message', () => {
  createRuleTester().run('dillon-anti-slop/no-module-mocking', noModuleMockingRule, {
    valid: [
      { code: 'const send = vi.fn()', options: strict },
      { code: "vi.useFakeTimers()\nvi.mock('./mailer')", options: [{ deny: ['*.spyOn'] }] },
      { code: "vi.mock('./mailer')", options: [{ deny: [] }] },
    ],
    invalid: [
      {
        code: "vi.spyOn(mailer, 'send')",
        options: [{ deny: ['vi.spyOn'] }],
        errors: [{ message: 'Replace vi.spyOn with dependency injection through a real interface, service layer, or faithful test implementation.' }],
      },
      {
        code: "import { vi as mocks } from 'vitest'\nmocks.stubGlobal('fetch', fetch)\njest.stubEnv('MODE', 'test')\nvi.mock('./mailer')",
        options: strict,
        errors: [
          { message: 'Inject a fake driver.' },
          { message: 'Inject a fake driver.' },
          { message: 'Inject a fake driver.' },
        ],
      },
      {
        code: "vi['spyOn'](mailer, 'send')",
        options: strict,
        errors: [{ message: 'Inject a fake driver.' }],
      },
      {
        code: 'vi.useFakeTimers()\nconst send = vi.fn()\njest.useFakeTimers()',
        options: [{ deny: ['vi.*'], allow: ['*.fn'] }],
        errors: [{ messageId: 'testDouble' }],
      },
      {
        code: "vi.mock('./mailer')",
        options: [{ deny: ['*'] }],
        errors: [{ messageId: 'moduleMock' }],
      },
    ],
  });
});

test('allow exempts matching APIs from the deny list', () => {
  createRuleTester().run('dillon-anti-slop/no-module-mocking', noModuleMockingRule, {
    valid: [
      { code: "vi.stubGlobal('fetch', fetch)", options: [{ ...strict[0], allow: ['*.fn', 'vi.stubGlobal'] }] },
      { code: "vi.mock('./mailer')\njest.spyOn(mailer, 'send')", options: [{ ...strict[0], allow: ['*'] }] },
    ],
    invalid: [
      {
        code: "vi.stubGlobal('fetch', fetch)\njest.stubGlobal('fetch', fetch)\nvi.spyOn(mailer, 'send')",
        options: [{ ...strict[0], allow: ['*.fn', 'vi.stubGlobal'] }],
        errors: [{ message: 'Inject a fake driver.' }, { message: 'Inject a fake driver.' }],
      },
    ],
  });
});

test('computed names match the whole method name', () => {
  createRuleTester().run('dillon-anti-slop/no-module-mocking', noModuleMockingRule, {
    valid: [{ code: 'vi["mock.cached"]()\njest["spyOn.extra"]()', options: strict }],
    invalid: [
      {
        code: 'vi["mock.cached"]()',
        options: [{ deny: ['*'] }],
        errors: [{ message: 'Replace vi.mock.cached with dependency injection through a real interface, service layer, or faithful test implementation.' }],
      },
    ],
  });
});

test('checkDestructured reports calls through bindings destructured from vi or jest', () => {
  const checked = [{ ...strict[0], checkDestructured: true }];
  createRuleTester().run('dillon-anti-slop/no-module-mocking', noModuleMockingRule, {
    valid: [
      { code: "const { mock, spyOn } = vi\nmock('./mailer')\nspyOn(mailer, 'send')", options: strict },
      { code: 'const { fn } = vi\nconst send = fn()', options: checked },
      { code: "const { spyOn } = local\nspyOn(mailer, 'send')", options: checked },
      { code: "const vi = { spyOn() {} }\nconst { spyOn } = vi\nspyOn(mailer, 'send')", options: checked },
      { code: "let { mock } = vi\nmock = () => {}\nmock('./mailer')", options: checked },
      { code: "var { mock } = vi\nvar mock = () => {}\nmock('./mailer')", options: checked },
    ],
    invalid: [
      {
        code: "const { mock, spyOn } = vi\nmock('./mailer')\nspyOn(mailer, 'send')",
        options: checked,
        errors: [{ message: 'Inject a fake driver.' }, { message: 'Inject a fake driver.' }],
      },
      {
        code: "import { vi } from 'vitest'\nconst { spyOn: spy, ['stubEnv']: stub, 'stubGlobal': global } = vi\nspy(mailer, 'send')\nstub('MODE', 'test')\nglobal('fetch', fetch)",
        options: checked,
        errors: [{ message: 'Inject a fake driver.' }, { message: 'Inject a fake driver.' }, { message: 'Inject a fake driver.' }],
      },
      {
        code: "const { doMock } = jest\ndoMock('./mailer')",
        options: [{ checkDestructured: true }],
        errors: [{ messageId: 'moduleMock' }],
      },
    ],
  });
});

test('invalid deny and allow patterns throw during setup', () => {
  const invalid = [
    { deny: ['sinon.stub'], allow: [] },
    { deny: [{ api: 'vi.spy*' }], allow: [] },
    { deny: [], allow: ['vi.mock.extra'] },
  ];

  for (const options of invalid) {
    expect(() =>
      createRuleTester().run('dillon-anti-slop/no-module-mocking', noModuleMockingRule, {
        valid: [{ code: "vi.mock('./mailer')", options: [options] }],
        invalid: [],
      }),
    ).toThrow('Test mocking APIs');
  }
});
