const MAX_RETRIES = 3;

export function constantsActionSend() {
  return { retries: MAX_RETRIES };
}
