function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function waitForMinimumAuthResponse(
  startedAtMilliseconds: number,
  minimumResponseMilliseconds: number
): Promise<void> {
  const remainingDelay = minimumResponseMilliseconds
    - (Date.now() - startedAtMilliseconds);

  if (remainingDelay > 0) {
    await wait(remainingDelay);
  }
}
