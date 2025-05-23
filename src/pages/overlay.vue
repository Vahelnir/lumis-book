<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import { waitForStateChange } from "@/utils/waitForStateChange";

import UIButton from "@/components/ui/UIButton.vue";
import VueBookFrame from "@/components/VueBookFrame.vue";

const CLOSE_AFTER_LAST_MESSAGE_TIMEOUT_MS = 8_000;

const hidden = ref(true);
const currentMessage = ref("");
const messageQueue = ref<string[]>([]);
const transitioning = ref(false);
const isOpened = ref(false);

const bookFrame = useTemplateRef("bookFrame");

async function fadeIn() {
  if (isOpened.value) return;

  hidden.value = false;
  transitioning.value = true;

  await waitForStateChange(() => !transitioning.value);
  isOpened.value = true;
}

async function fadeOut() {
  if (!isOpened.value) return;

  hidden.value = true;
  transitioning.value = true;

  await waitForStateChange(() => !transitioning.value);
  isOpened.value = false;
}

async function send() {
  if (currentMessage.value.trim() === "") return;

  const text = currentMessage.value;
  currentMessage.value = "";

  messageQueue.value.push(text);
  await sendAllMessages();
}

const isSending = ref(false);
async function sendAllMessages() {
  if (isSending.value) return;

  isSending.value = true;
  clearScheduledClosing();
  await fadeIn();
  while (messageQueue.value.length > 0) {
    const message = messageQueue.value.shift()!;
    await bookFrame.value?.writeMessage(message);
  }

  messageQueue.value = [];
  scheduleClosing();
  isSending.value = false;
}

let closingTimeoutId: ReturnType<typeof setTimeout> | undefined;
function scheduleClosing() {
  closingTimeoutId = setTimeout(async () => {
    await bookFrame.value?.close();
    await fadeOut();
  }, CLOSE_AFTER_LAST_MESSAGE_TIMEOUT_MS);
}

function clearScheduledClosing() {
  if (closingTimeoutId) clearTimeout(closingTimeoutId);
}
</script>

<template>
  <div
    class="fixed top-40 right-20 transition-all duration-1000"
    :class="{
      'translate-y-0 opacity-100': !hidden,
      'translate-y-40 opacity-0': hidden,
    }"
    @transitionstart="transitioning = true"
    @transitionend="transitioning = false"
  >
    <VueBookFrame ref="bookFrame"></VueBookFrame>
  </div>

  <div class="flex gap-2">
    <textarea
      v-model="currentMessage"
      type="text"
      class="rounded border px-4 py-2"
      @keydown.enter.prevent.stop="send"
    />
    <UIButton @click="send()"> Send </UIButton>
  </div>
</template>

<style scoped>
.animate-out {
  animation: fade-out 0.7s forwards;
}

.animate-in {
  animation: fade-in 0.7s forwards;
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(10rem);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
