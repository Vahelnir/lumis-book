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

const loading = ref(false);
async function addMessageEvent() {
  if (!book.value) {
    return;
  }

  const messages = [
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  await handleLoading(book.value?.writeMessage(message));
}

async function handleLoading(promise: Promise<unknown>) {
  loading.value = true;
  await promise;
  loading.value = false;
}
</script>

<template>
  <div ref="bookElement"></div>
  <div v-if="book" class="mt-20 flex gap-2">
    <div class="flex items-center gap-2">
      <UIButton
        :disabled="loading"
        @click="handleLoading(book.movePagePair(-1))"
      >
        Previous
      </UIButton>
      <div>
        {{ currentPair + 1 }} /
        {{ pairCount }}
      </div>
      <UIButton
        :disabled="loading"
        @click="handleLoading(book.movePagePair(1))"
      >
        Next
      </UIButton>
    </div>
    <UIButton :disabled="loading" @click="addMessageEvent">
      Add message
    </UIButton>
  </div>
</template>
