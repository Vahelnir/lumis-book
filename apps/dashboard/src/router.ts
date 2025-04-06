import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", component: () => import("./pages/index.vue") },
  { path: "/playground", component: () => import("./pages/playground.vue") },
  { path: "/overlay", component: () => import("./pages/overlay.vue") },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
