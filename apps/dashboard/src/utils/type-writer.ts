import { TYPING_ANIMATION_DURATION } from "@/core/constants";

export async function typeWriter(text: string, func: (letter: string) => void) {
  return new Promise<ReturnType<typeof setInterval>>((resolve) => {
    let index = 0;
    const intervalId = setInterval(async () => {
      func(text[index++]);

      if (intervalId && index >= text.length) {
        clearInterval(intervalId);
        resolve(intervalId);
      }
    }, TYPING_ANIMATION_DURATION);
  });
}
