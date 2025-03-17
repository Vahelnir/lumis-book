<script lang="ts">
export { Page } from "@/core/page";
</script>

<script setup lang="ts">
import { ref, shallowRef, useTemplateRef, watch } from "vue";
import { Book } from "@/core/book";
import type { Page } from "@/core/page";

defineProps<{
  theme?: string;
}>();

const emit = defineEmits<{
  "update:isBusy": [isBusy: boolean];
  "update:currentPairIndex": [currentPairIndex: number];
  "update:pages": [pages: Page[]];
  "update:pairCount": [pairCount: number];
}>();

const bookElement = useTemplateRef("bookElement");
const book = shallowRef<Book>();

watch(bookElement, async (element, _, onCleanup) => {
  if (!element) {
    return;
  }

  book.value = new Book(element, {
    onCurrentPairChange: (currentPairIndex) => {
      emit("update:currentPairIndex", currentPairIndex);
    },
    onPageCreation: (pages) => {
      emit("update:pairCount", Math.round(pages.length / 2));
      emit("update:pages", pages);
    },
  });

  emit("update:currentPairIndex", book.value.currentPairIndex);

  onCleanup(() => book.value?.destroy());
});

const isBusy = ref(false);

function setBusy(value: boolean) {
  isBusy.value = value;
  emit("update:isBusy", value);
}

async function act(promise: Promise<unknown>) {
  setBusy(true);
  await promise;
  setBusy(false);
}

defineExpose({
  async writeMessage(message: string) {
    if (!book.value) {
      return;
    }

    await act(book.value.writeMessage(message));
  },
  moveToPagePair: (index: number) => {
    if (!book.value) {
      return;
    }

    return act(book.value.moveToPagePair(index));
  },
  movePagePair: (index: number) => {
    if (!book.value) {
      return;
    }

    return act(book.value.movePagePair(index));
  },
  open: () => {
    if (!book.value) {
      return;
    }

    return act(book.value.open());
  },
  close: () => {
    if (!book.value) {
      return;
    }

    return act(book.value.close());
  },
});
</script>

<template>
  <div ref="bookElement" :data-theme="theme"></div>
</template>
