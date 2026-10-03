export const extraValue = 1;

export function makeExtraService() {
  return { id: 'one' };
}

export type ExtraService = ReturnType<typeof makeExtraService>;
