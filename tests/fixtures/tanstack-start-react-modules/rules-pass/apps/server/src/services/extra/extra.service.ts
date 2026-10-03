export function makeExtraService() { return { send: extraActionSend }; } export type ExtraService = ReturnType<typeof makeExtraService>;
