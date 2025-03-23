export async function waitForStateChange(
  func: () => unknown | Promise<unknown>,
) {
  await new Promise<void>((resolve) => {
    const checkIfWritingIsDone = async () => {
      const funcResult = func();
      const result =
        funcResult instanceof Promise ? await funcResult : funcResult;
      if (!result) {
        requestAnimationFrame(checkIfWritingIsDone);
        return;
      }

      resolve();
    };

    requestAnimationFrame(checkIfWritingIsDone);
  });
}
