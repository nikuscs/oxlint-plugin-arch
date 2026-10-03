function helperBuild() {
  return 1;
}

export function helperActionSend() {
  return { count: helperBuild() };
}
