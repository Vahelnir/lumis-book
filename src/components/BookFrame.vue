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

const message = ref("");
async function sendMessage() {
  if (!book.value) {
    return;
  }

  const text = message.value;
  message.value = "";
  await handleLoading(book.value?.writeMessage(text));
}

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
  <div v-if="book" class="mt-20 flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <UIButton
          :disabled="loading || currentPair <= 0"
          @click="handleLoading(book.moveToPagePair(0))"
        >
          First
        </UIButton>
        <UIButton
          :disabled="loading || currentPair <= 0"
          @click="handleLoading(book.movePagePair(-1))"
        >
          Previous
        </UIButton>
        <div>
          {{ currentPair + 1 }} /
          {{ pairCount }}
        </div>
        <UIButton
          :disabled="loading || currentPair + 1 >= pairCount"
          @click="handleLoading(book.movePagePair(1))"
        >
          Next
        </UIButton>
        <UIButton
          :disabled="loading || currentPair + 1 >= pairCount"
          @click="handleLoading(book.moveToPagePair(pairCount - 1))"
        >
          Last
        </UIButton>
      </div>
      <div class="flex gap-2">
        <UIButton :disabled="loading" @click="addMessageEvent">
          Add "lorem ipsum"
        </UIButton>
        <UIButton :disabled="loading" @click="handleLoading(book.open())">
          Ouvrir
        </UIButton>
        <UIButton :disabled="loading" @click="handleLoading(book.close())">
          Fermer
        </UIButton>
      </div>
    </div>

    <div class="flex w-80 gap-2">
      <textarea v-model="message" class="w-full rounded border px-4 py-2" />
      <UIButton :disabled="loading" @click="sendMessage">Send</UIButton>
    </div>
  </div>
</template>
