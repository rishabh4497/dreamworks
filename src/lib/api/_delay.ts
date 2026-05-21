export function wait(ms = 120): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
