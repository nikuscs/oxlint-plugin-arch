export function makeAliasService() {
  return { id: 'one' };
}

export type AliasService = ReturnType<typeof makeOtherService>;
