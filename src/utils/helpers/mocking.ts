/** Throws unless every pattern is `*` or `<vi|jest|*>.<method|*>`. */
export function mockingApiPatternsAssert(patterns: string[]): void {
  if (patterns.some((pattern) => !/^(?:\*|(?:vi|jest|\*)\.(?:[A-Za-z_$][\w$]*|\*))$/.test(pattern)))
    throw new Error('Test mocking APIs must be `*` or `<vi|jest|*>.<method|*>`.')
}
