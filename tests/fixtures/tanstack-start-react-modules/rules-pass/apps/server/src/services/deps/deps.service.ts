export function makeDepsService() { return { send: depsActionSend }; } export type DepsService = ReturnType<typeof makeDepsService>;
