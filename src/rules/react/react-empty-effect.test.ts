import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { reactEmptyEffect } from './react-empty-effect.ts'

describe('arch/react-empty-effect', () => {
  it.each([
    { name: 'effect with work passes', code: 'useEffect(() => { track(page) }, [page])' },
    { name: 'expression callback passes', code: 'useEffect(() => track(page), [page])' },
    { name: 'cleanup-only effect passes', code: 'useEffect(() => { return () => cleanup() }, [])' },
    { name: 'referenced callback passes', code: 'useEffect(onMount, [])' },
    { name: 'unrelated empty callback passes', code: 'subscribe(() => {})' },
    { name: 'other namespace is ignored', code: 'custom.useEffect(() => {}, [])' },
    { name: 'empty arrow effect fails', code: 'useEffect(() => {}, [])', errors: ['forbidden'] },
    { name: 'empty function effect fails', code: 'useEffect(function () {}, [])', errors: ['forbidden'] },
    { name: 'layout effect fails', code: 'useLayoutEffect(() => {}, [])', errors: ['forbidden'] },
    { name: 'React namespace effect fails', code: 'React.useEffect(() => {}, [])', errors: ['forbidden'] },
    { name: 'React namespace layout effect fails', code: 'React.useLayoutEffect(function () {}, [])', errors: ['forbidden'] },
    { name: 'comment does not count as work', code: 'useEffect(() => { /* reserved */ }, [])', errors: ['forbidden'] },
    { name: 'custom message is accepted', code: 'useEffect(() => {}, [])', options: { message: 'Delete unused effects.' }, errors: ['forbidden'] },
  ])('$name', (row) => testerRun(reactEmptyEffect, row))
})
