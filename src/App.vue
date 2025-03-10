<script setup lang="ts">
import { ref } from "vue";
import BookFrame from "./components/BookFrame.vue";

const messages = ref<string[]>([
  "Ahah merci, bienvenue par ici ! :D",
  "Niceee elle est plus buguée",
  "Ptet qu'on pouvait en avoir qu'une à la fois en fait",
  "Fudge cétait où mar",
  "Merci beaucoup pour le prime A6doff !!! :D",
  // some more
  "Ahah merci, bienvenue par ici ! :D",
  "Niceee elle est plus buguée",
  "Ptet qu'on pouvait en avoir qu'une à la fois en fait",
]);
// const messages = ref<string[]>([]);

const messageToAdd = ref("");

function addMessage() {
  messages.value.push(messageToAdd.value);
  messageToAdd.value = "";
  console.log("hello");
}
</script>

<template>
  <div class="p-4">
    <BookFrame></BookFrame>

    <div>
      <label class="flex flex-col">
        Message à ajouter
        <input
          v-model="messageToAdd"
          type="text"
          class="rounded border border-black px-2 py-1"
          @keyup.enter="addMessage()"
        />
      </label>
    </div>
  </div>
</template>
