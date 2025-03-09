<script setup lang="ts">
import TypeWriter from "./TypeWriter.vue";

const messages = defineModel<string[]>({ required: true });
</script>

<template>
  <div class="border-2 rounded-lg w-80 h-60 relative">
    <div class="h-full w-full columns-2 overflow-hidden gap-2 test-col p-1">
      <div
        v-for="message in messages"
        :key="message"
        class="group/message break-inside-avoid-column relative"
      >
        <div class="p-1 group-odd/message:bg-gray-100 rounded absolute">
          <p class="text-sm">
            <TypeWriter :message />
          </p>
        </div>
        <!-- Used to fix the size of the block to the real size -->
        <div class="p-1 invisible">
          <p class="text-sm">
            {{ message }}
          </p>
        </div>
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
