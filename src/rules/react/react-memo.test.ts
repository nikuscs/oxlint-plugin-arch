import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { reactMemo } from './react-memo.ts'

describe('arch/react-memo', () => {
  it.each([
    { name: 'direct calculation passes', code: 'const total = sum(items)' },
    { name: 'other React imports pass', code: "import { useState, useEffect } from 'react'" },
    { name: 'other packages pass', code: "import { memo } from 'cache'\nmemo(work)" },
    { name: 'unrelated namespace passes', code: 'cache.useMemo(work)' },
    { name: 'unimported bare call is ignored', code: 'useMemo(work)' },
    { name: 'a parameter shadowing React passes', code: "import * as React from 'react'\nfunction f(React: { memo(): void }) { React.memo() }" },
    { name: 'a local React binding passes', code: 'const React = cache\nReact.useMemo(work)' },
    { name: 'a namespace from another package passes', code: "import * as R from 'cache'\nR.useMemo(work)" },
    { name: 'memo import fails', code: "import { memo } from 'react'", errors: ['memo'] },
    { name: 'useMemo import fails', code: "import { useMemo } from 'react'", errors: ['memo'] },
    { name: 'aliased callback import fails', code: "import { useCallback as callback } from 'react'", errors: ['memo'] },
    { name: 'each banned import reports', code: "import { memo, useMemo, useCallback } from 'react'", errors: ['memo', 'memo', 'memo'] },
    { name: 'React member fails without import', code: 'React.memo(Component)', errors: ['memo'] },
    { name: 'default import alias is tracked', code: "import R from 'react'\nR.useMemo(work)", errors: ['memo'] },
    { name: 'namespace import alias is tracked', code: "import * as R from 'react'\nR.useCallback(work)", errors: ['memo'] },
    { name: 'member reference need not be called', code: 'const wrap = React.memo', errors: ['memo'] },
  ])('$name', (row) => testerRun(reactMemo, row))
})
