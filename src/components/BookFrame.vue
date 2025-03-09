<script setup lang="ts">
import { ref } from "vue";

const messages = ref<string[]>([
  "Ahah merci, bienvenue par ici ! :D",
  "Niceee elle est plus buguée",
  "Ptet qu'on pouvait en avoir qu'une à la fois en fait",
  "Fudge cétait où mar",
  "Merci beaucoup pour le prime A6doff !!! :D",
]);
</script>

<template>
  <div class="border-2 rounded-lg w-80 h-60 relative">
    <div class="h-full w-full columns-2 overflow-hidden gap-2 test-col p-1">
      <div
        v-for="message in messages"
        :key="message"
        class="p-1 break-inside-avoid-column odd:bg-gray-100 rounded"
      >
        <p class="text-sm">
          {{ message }}
        </p>
      </div>
    </div>
    <div
      class="absolute left-0 right-0 h-full w-[2px] bg-black mx-auto top-0"
    ></div>
  </div>
</template>

<style scoped>
.test-col {
  column-fill: auto;
}
</style>
