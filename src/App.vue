<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import BookFrame from "./components/BookFrame.vue";
import UIButton from "./components/UIButton.vue";

const book = useTemplateRef<InstanceType<typeof BookFrame>>("book");
const themes = [undefined, "minecraft"] as const;
const selectedTheme = ref<(typeof themes)[number]>();
const pairCount = ref(0);
const message = ref("");
const isBusy = ref(false);
const currentPair = ref(0);

async function sendMessage() {
  if (!book.value) {
    return;
  }

  const text = message.value;
  message.value = "";
  await book.value.writeMessage(text);
}

async function addMessageEvent() {
  if (!book.value) {
    return;
  }

  const messages = [
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  await book.value?.writeMessage(message);
}
</script>

<template>
  <div class="p-4">
    <BookFrame
      ref="book"
      :theme="selectedTheme"
      @update:is-busy="isBusy = $event"
      @update:current-pair-index="currentPair = $event"
      @update:pair-count="pairCount = $event"
    ></BookFrame>

    <div v-if="book" class="mt-20 flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <UIButton
            :disabled="isBusy || currentPair <= 0"
            @click="book.moveToPagePair(0)"
          >
            First
          </UIButton>
          <UIButton
            :disabled="isBusy || currentPair <= 0"
            @click="book.movePagePair(-1)"
          >
            Previous
          </UIButton>
          <div>
            {{ currentPair + 1 }} /
            {{ pairCount }}
          </div>
          <UIButton
            :disabled="isBusy || currentPair + 1 >= pairCount"
            @click="book.movePagePair(1)"
          >
            Next
          </UIButton>
          <UIButton
            :disabled="isBusy || currentPair + 1 >= pairCount"
            @click="book.moveToPagePair(pairCount - 1)"
          >
            Last
          </UIButton>
        </div>
        <div class="flex gap-2">
          <UIButton :disabled="isBusy" @click="addMessageEvent">
            Add "lorem ipsum"
          </UIButton>
          <UIButton :disabled="isBusy" @click="book.open()"> Ouvrir </UIButton>
          <UIButton :disabled="isBusy" @click="book.close()"> Fermer </UIButton>
          <select v-model="selectedTheme" class="rounded border px-4 py-2">
            <option v-for="theme in themes" :key="theme" :value="theme">
              {{ theme || "Default" }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex w-80 gap-2">
        <textarea v-model="message" class="w-full rounded border px-4 py-2" />
        <UIButton :disabled="isBusy" @click="sendMessage">Send</UIButton>
      </div>
    </div>
  </div>
</template>

<style>
.book[data-theme="minecraft"] {
  height: 432px;
  width: 672px;

  .page {
    padding: 16px 24px;
    border: none;
    box-shadow: none;

    &.page--left {
      background: url(/mc-left-side.png) no-repeat;
      background-size: contain;
    }

    &.page--right {
      background: url(/mc-right-side.png) no-repeat;
      background-size: contain;
    }
  }
}
</style>
