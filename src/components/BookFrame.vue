<script setup lang="ts">
import { ref, useTemplateRef, watch } from "vue";
import { Book } from "@/core/Book";

const bookElement = useTemplateRef("bookElement");
let book: Book | undefined;
watch(bookElement, async (element, _, onCleanup) => {
  if (!element) {
    return;
  }

  book = new Book(element);

  onCleanup(() => book?.destroy());
});

const isMessageTyping = ref(false);
async function addMessageEvent() {
  if (!book) {
    return;
  }

  const messages = [
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  isMessageTyping.value = true;
  await book.writeMessage(message);
  isMessageTyping.value = false;
}
</script>

<template>
  <div ref="bookElement"></div>
  <button
    class="mt-20 rounded border px-4 py-2 disabled:opacity-40"
    :disabled="isMessageTyping"
    @click="addMessageEvent"
  >
    Add message
  </button>
</template>
