<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import UIButton from "@/components/ui/UIButton.vue";
import VueBookFrame from "@/components/VueBookFrame.vue";

const hidden = ref(true);

const bookFrame = useTemplateRef("bookFrame");

async function toggle() {
  if (hidden.value) {
    return open();
  }

  return close();
}

async function open() {
  hidden.value = false;
}

async function close() {
  await bookFrame.value?.close();
  hidden.value = true;
}

async function onAnimationEnd() {
  if (hidden.value) {
    return;
  }

  await bookFrame.value?.open();
}
</script>

<template>
  <UIButton @click="toggle">Close</UIButton>

  <div
    class="fixed top-40 right-20 opacity-0"
    :class="{
      'animate-out': hidden,
      'animate-in': !hidden,
    }"
    @animationend="onAnimationEnd"
  >
    <VueBookFrame ref="bookFrame"></VueBookFrame>
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
