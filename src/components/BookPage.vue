<script lang="ts">
export type PageState = {
  side: "left" | "right";
  flipped: boolean;
  hidden: boolean;
  inFront: boolean;
  messages: Message[];
};

export type Size = {
  width: number;
  height: number;
};
</script>

<script setup lang="ts">
import { FLIPPING_ANIMATION_DURATION } from "@/core/book";
import { createMessageElement } from "@/core/message";
import { PAGE_CLASSES, PAGE_CONTENT_CLASSES } from "@/core/page";
import { useTemplateRef } from "vue";
import type { Message } from "./BookMessage.vue";
import BookMessage from "./BookMessage.vue";

const state = defineModel<PageState>("state", { required: true });

const pageContentElement = useTemplateRef("pageContent");

function getContentElementOrFail() {
  if (!pageContentElement.value) {
    throw new Error("Page content element is not available");
  }

  return pageContentElement.value;
}

function tryFittingMessage(text: string) {
  const contentElement = getContentElementOrFail();
  const size = {
    width: contentElement.clientWidth,
    height: contentElement.clientHeight,
  };

  const clonedElement = cloneForFitting();

  // TODO: find a way to properly break the words if too long
  const words = text.split(" ");

  // TODO: create the fake element with the same styles as the real message
  const fakeMessageElement = createMessageElement("white");
  fakeMessageElement.textContent = words[0] + " ";
  clonedElement.appendChild(fakeMessageElement);

  if (clonedElement.scrollHeight > clonedElement.clientHeight) {
    clonedElement.remove();
    return { text: undefined, overflowingText: words.join(" ") };
  }

  for (let index = 1; index < words.length; index++) {
    const word = words[index];
    fakeMessageElement.textContent += word + " ";

    if (clonedElement.scrollHeight <= clonedElement.clientHeight) {
      continue;
    }

    clonedElement.remove();

    return {
      text: fakeMessageElement.textContent?.slice(0, -(word.length + 1)),
      overflowingText: "... " + words.slice(index).join(" "),
    };
  }

  clonedElement.remove();

  return { text: fakeMessageElement.textContent, overflowingText: undefined };
}

function cloneForFitting() {
  const originalElement = getContentElementOrFail();
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  const computedStyle = window.getComputedStyle(originalElement);
  for (const key of computedStyle) {
    clonedElement.style.setProperty(key, computedStyle.getPropertyValue(key));
  }

  clonedElement.style.visibility = "hidden";
  clonedElement.style.position = "absolute";
  document.body.appendChild(clonedElement);

  return clonedElement;
}

defineExpose({
  tryFittingMessage,
});
</script>

<template>
  <div
    :style="{
      transitionDuration: `${FLIPPING_ANIMATION_DURATION}ms`,
    }"
    :class="[
      PAGE_CLASSES(state.side),
      {
        'rotate-y-180': state.flipped && state.side === 'left',
        '-rotate-y-180': state.flipped && state.side === 'right',
        hidden: state.hidden,
        'z-1': state.inFront,
      },
    ]"
  >
    <div ref="pageContent" :class="PAGE_CONTENT_CLASSES">
      <BookMessage
        v-for="(_, index) in state.messages"
        :key="index"
        v-model="state.messages[index]"
      ></BookMessage>
    </div>
  </div>
</template>
