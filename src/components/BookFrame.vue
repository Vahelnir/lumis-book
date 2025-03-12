<script setup lang="ts">
import { ref, shallowRef, useTemplateRef, watch } from "vue";
import { Book } from "@/core/book";
import UIButton from "./UIButton.vue";

const bookElement = useTemplateRef("bookElement");
const book = shallowRef<Book>();
watch(bookElement, async (element, _, onCleanup) => {
  if (!element) {
    return;
  }

  book.value = new Book(element);

  onCleanup(() => book.value?.destroy());
});

const isMessageTyping = ref(false);
async function addMessageEvent() {
  if (!book.value) {
    return;
  }

  const messages = [
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  isMessageTyping.value = true;
  await book.value.writeMessage(message);
  isMessageTyping.value = false;
}
</script>

<template>
  <div ref="bookElement"></div>
  <div v-if="book" class="mt-20 flex gap-2">
    <div class="flex items-center gap-2">
      <UIButton @click="book.movePagePair(-1)">Previous</UIButton>
      <div>
        {{ book.currentPairIndex + 1 }} /
        {{ Math.round(book.pages.length / 2) }}
      </div>
      <UIButton @click="book.movePagePair(1)">Next</UIButton>
    </div>
    <UIButton :disabled="isMessageTyping" @click="addMessageEvent">
      Add message
    </UIButton>
  </div>
</template>
