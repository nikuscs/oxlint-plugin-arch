export interface Deps {
  id: string;
}

export function makeDepsService() {
  return { id: 'one' };
}
