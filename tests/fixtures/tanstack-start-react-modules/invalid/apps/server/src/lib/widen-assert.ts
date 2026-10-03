const original = { id: 'one' };
const widened: object = original;

export const restored = widened as { id: string };
