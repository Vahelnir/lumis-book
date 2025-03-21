<script setup lang="ts">
import BookPlayground from "./components/BookPlayground.vue";
import VueBookPlayground from "./components/VueBookPlayground.vue";
</script>

<template>
  <div class="grid grid-cols-2">
    <BookPlayground />
    <VueBookPlayground />
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
