<script setup lang="ts">
import { ref, useTemplateRef, watch } from "vue";
import TypeWriter from "./TypeWriter.vue";
import { Book } from "@/core/Book";

const messages = defineModel<string[]>({ required: true });

const bookElement = useTemplateRef("bookElement");

let book: Book | undefined;
watch(bookElement, async (element, _, onCleanup) => {
  if (!element) {
    return;
  }

  book = new Book(element);
  // for (const message of messages.value) {
  //   book.addMessage(message);
  // }

  // book.addMessage(longText);
  // // book.addMessage(longText);
  // book.addMessage("aa bb cc dd");

  onCleanup(() => book?.destroy());
});

const disableButton = ref(false);
async function addMessage() {
  if (!book) {
    return;
  }

  disableButton.value = true;
  await book.addMessage("Ahah merci, bienvenue par ici ! :D");
  disableButton.value = false;
}
</script>

<template>
  <div class="relative h-60 w-80 rounded-lg border-2">
    <div class="h-full w-full columns-2 gap-2 p-1">
      <div
        v-for="message in messages"
        :key="message"
        class="group/message relative"
      >
        <div
          class="absolute rounded p-1 text-ellipsis group-odd/message:bg-gray-100"
        >
          <p class="text-sm text-ellipsis">
            <TypeWriter :message />
          </p>
        </div>
        <!-- Used to fix the size of the block to the real size -->
        <div class="invisible p-1">
          <p class="text-sm">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
    <div
      class="absolute top-0 right-0 left-0 mx-auto h-full w-[2px] bg-black"
    ></div>
  </div>
  <div ref="bookElement"></div>
  <button
    class="rounded border px-4 py-2"
    :disabled="disableButton"
    @click="addMessage"
  >
    Add message
  </button>
</template>
