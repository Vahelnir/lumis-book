import { tw } from "@/utils/tw";

export type Message = {
  text: string;
  color: "white" | "gray";
};

export function createMessageElement(color: "white" | "gray") {
  const messageBlock = document.createElement("div");
  messageBlock.classList.add(
    ...tw`message rounded p-1 break-words backface-hidden`.split(" "),
  );
  if (color === "gray") {
    messageBlock.classList.add(...tw`message--gray bg-stone-300/20`.split(" "));
  }

  return messageBlock;
}
