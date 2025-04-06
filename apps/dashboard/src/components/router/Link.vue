<script setup lang="ts">
import { RouterLink, type RouterLinkProps } from "vue-router";

import UILink from "../ui/UILink.vue";

defineOptions({
  inheritAttrs: false,
});

defineProps<
  RouterLinkProps & {
    inactiveClass?: string;
  }
>();
</script>

<template>
  <RouterLink v-slot="{ isActive, href, navigate }" v-bind="$props" custom>
    <UILink
      v-bind="$attrs"
      :href="href"
      :class="isActive ? activeClass : inactiveClass"
      @click="navigate"
    >
      <slot />
    </UILink>
  </RouterLink>
</template>
