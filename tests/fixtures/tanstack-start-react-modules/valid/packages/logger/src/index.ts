export function loggerWrite(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
