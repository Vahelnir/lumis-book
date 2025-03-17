<script lang="ts">
export type Message = {
  text: string;
  color: "gray" | "white";
  writing: boolean;
};
</script>

<script setup lang="ts">
import { typeWriter } from "@/utils/type-writer";
import { onMounted, ref } from "vue";

const message = defineModel<Message>({ required: true });

// NOTE: simplify by not caring about the reactivity here
const internalMessageText = ref("");
onMounted(async () => {
  if (!message.value.writing) {
    internalMessageText.value = message.value.text;
    return;
  }

  await typeWriter(message.value.text, (letter) => {
    internalMessageText.value += letter;
  });

  message.value.writing = false;
});
</script>

<template>
  <div
    class="message rounded p-1 break-words backface-hidden"
    :class="{
      'message--gray bg-stone-300/20': message.color === 'gray',
    }"
  >
    {{ internalMessageText }}
  </div>
</template>
