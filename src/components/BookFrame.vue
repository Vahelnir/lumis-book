<script setup lang="ts">
import { ref, shallowRef, useTemplateRef, watch } from "vue";
import { Book } from "@/core/book";
import UIButton from "./UIButton.vue";

const bookElement = useTemplateRef("bookElement");
const book = shallowRef<Book>();
const currentPair = ref(0);
const pairCount = ref(0);
watch(bookElement, async (element, _, onCleanup) => {
  if (!element) {
    return;
  }

  book.value = new Book(element, {
    onCurrentPairChange: (currentPairIndex) => {
      currentPair.value = currentPairIndex;
    },
    onPageCreation: (pages) => {
      pairCount.value = Math.round(pages.length / 2);
    },
  });

  currentPair.value = book.value.currentPairIndex;

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
        {{ currentPair + 1 }} /
        {{ pairCount }}
      </div>
      <UIButton @click="book.movePagePair(1)">Next</UIButton>
    </div>
    <UIButton :disabled="isMessageTyping" @click="addMessageEvent">
      Add message
    </UIButton>
  </div>
</template>
