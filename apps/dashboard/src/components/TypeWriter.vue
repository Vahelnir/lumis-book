<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ message: string }>();

const internalMessage = ref("");
const index = ref(0);

let intervalId: ReturnType<typeof setInterval> | null = null;

watch(
  () => props.message,
  () => {
    index.value = 0;
    internalMessage.value = "";

    startInterval();
  },
  { immediate: true },
);

function startInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(() => {
    appendNextCharacter();

    if (intervalId && index.value >= props.message.length) {
      clearInterval(intervalId);
    }
  }, 40);
}

function appendNextCharacter() {
  internalMessage.value += props.message[index.value++];
}
</script>

<template>
  <span>{{ internalMessage }}</span>
</template>
