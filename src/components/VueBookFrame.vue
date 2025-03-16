<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  useTemplateRef,
} from "vue";
import { GENERIC_PAGE_CLASSES, Page } from "@/core/page";
import type { Message } from "@/core/message";
import { tw } from "@/utils/tw";
import { nextRepaint } from "@/utils/nextRepaint";
import { wait } from "@/utils/wait";

const FLIPPING_ANIMATION_DURATION = 1000;

const emit = defineEmits<{
  "update:isAnimating": [isBusy: boolean];
  "update:currentPairIndex": [currentPairIndex: number];
  "update:pages": [pages: Page[]];
  "update:pairCount": [pairCount: number];
}>();

const cover = useTemplateRef("coverElement");

const previousMessageColor = ref<Message["color"]>("gray");

const _currentPairIndex = ref(0);
const currentPairIndex = computed({
  get: () => _currentPairIndex.value,
  set: (value: number) => {
    _currentPairIndex.value = value;
    emit("update:currentPairIndex", value);
  },
});

const pages = shallowRef<Page[]>([]);
createPagePair();
const currentWritingPage = shallowRef<Page>(pages.value[0]);

const currentPair = computed(() => {
  const pair = getPair(currentPairIndex.value);
  console.log("currentPair", pair, pages.value);
  if (!pair) {
    throw new Error(
      `No pair of pages found at pair current index ${currentPairIndex.value}`,
    );
  }

  return pair;
});

const pagesElement = useTemplateRef("pagesElement");

onMounted(() => {
  const mountingPoint = pagesElement.value;
  if (!mountingPoint) {
    throw new Error("pages element not found");
  }

  const [left, right] = currentPair.value;
  left.mount(mountingPoint);
  right.mount(mountingPoint);
});

onUnmounted(() => {
  pages.value.forEach((page) => page.unmount());
  pagesElement.value?.remove();
});

async function writeMessage(
  message: string,
  color?: Message["color"],
): Promise<void> {
  if (!currentPair.value.includes(currentWritingPage.value)) {
    await focusPage(currentWritingPage.value);
  }

  if (color) {
    previousMessageColor.value = color;
  } else {
    previousMessageColor.value =
      previousMessageColor.value === "gray" ? "white" : "gray";
  }

  const { text, overflowingText } =
    currentWritingPage.value.tryFittingMessage(message);
  if (!text) {
    await moveWritingPage();
    await writeMessage(message, previousMessageColor.value);
    return;
  }

  await currentWritingPage.value.writeMessage({
    text,
    color: previousMessageColor.value,
  });

  if (overflowingText) {
    await moveWritingPage(true);
    await writeMessage(overflowingText, previousMessageColor.value);
    return;
  }
}

async function moveWritingPage(isContinuingWriting = false) {
  if (currentWritingPage.value.side === "right") {
    // If we reach the end of the right page, and still have stuff to write
    if (isContinuingWriting) {
      await wait(2000);
    }

    createPagePair();

    await movePagePair(1);
    currentWritingPage.value = currentPair.value[0];
    return;
  }

  currentWritingPage.value = currentPair.value[1];
}

async function focusPage(page: Page) {
  const pageIndex = pages.value.indexOf(page);
  const pairIndex = Math.floor(pageIndex / 2);
  await moveToPagePair(pairIndex);
}

async function moveToPagePair(index: number) {
  const offset = index - currentPairIndex.value;
  await movePagePair(offset);
}

async function movePagePair(offset: number) {
  const mountingElement = pagesElement.value;
  if (!mountingElement) {
    throw new Error("No pages element found");
  }

  if (offset === 0) {
    return;
  }

  const targetPair = getPair(currentPairIndex.value + offset);
  if (!targetPair) {
    return;
  }

  targetPair.map((page) => page.mount(mountingElement));

  const [oldLeftPage, oldRightPage] = currentPair.value;
  if (offset > 0) {
    const [leftPage] = targetPair;

    // make both pages be on top of every other page to avoid
    // the flicker effect that happens when the old right page
    // goes over the new left page
    oldRightPage.element?.classList.add(tw`z-1`);
    leftPage.element?.classList.add(tw`z-1`);

    // flip previous right page to the left
    oldRightPage.element?.classList.add(tw`-rotate-y-180`);
    // force the new leftPage to be flipped OVER the current right page
    leftPage.element?.classList.add(tw`rotate-y-180`);

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    leftPage.element?.classList.remove(tw`rotate-y-180`);
  } else {
    const [, rightPage] = targetPair;

    // make both pages be on top of every other page
    oldLeftPage.element?.classList.add(tw`z-1`);
    rightPage.element?.classList.add(tw`z-1`);
    // flip previous right page to the left
    oldLeftPage.element?.classList.add(tw`rotate-y-180`);
    // force the new leftPage to be flipped OVER the current right page
    rightPage.element?.classList.add(tw`-rotate-y-180`);

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    rightPage.element?.classList.remove(tw`-rotate-y-180`);
  }

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      // hide the old pages (we could remove them from the dom too)
      oldLeftPage.unmount();
      oldRightPage.unmount();

      currentPairIndex.value += offset;

      resolve();
    }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition time
  });
}

function getPair(index: number): [Page, Page] | undefined {
  const pageIndex = index * 2;
  const left = pages.value[pageIndex];
  const right = pages.value[pageIndex + 1];
  if (!left || !right) {
    return undefined;
  }

  return [left, right];
}

function createPagePair(): [Page, Page] {
  const leftPage = new Page("left");
  const rightPage = new Page("right");

  pages.value.push(leftPage, rightPage);
  emit("update:pages", pages.value);
  emit("update:pairCount", Math.round(pages.value.length / 2));
  return [leftPage, rightPage];
}

async function open() {
  const [leftPage, rightPage] = currentPair.value;

  // display the left page
  leftPage.element?.classList.remove(tw`hidden`);

  await nextRepaint();

  // flip the cover and the left page
  leftPage.element?.classList.remove(tw`rotate-y-180`);
  cover.value?.classList.add(tw`-rotate-y-180`);

  await nextRepaint();

  // then display the right page
  rightPage.element?.classList.remove(tw`hidden`);

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition
  });
}
async function close() {
  const [leftPage, rightPage] = currentPair.value;

  // make both pages be on top of every other page to avoid
  // the flicker effect that happens when the old right page
  // goes over the new left page
  cover.value?.classList.add(tw`z-1`);
  leftPage.element?.classList.add(tw`z-1`);

  cover.value?.classList.remove(tw`-rotate-y-180`);
  leftPage.element?.classList.add(tw`rotate-y-180`);

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      leftPage.element?.classList.add(tw`hidden`);
      rightPage.element?.classList.add(tw`hidden`);
      cover.value?.classList.remove(tw`z-1`);
      leftPage.element?.classList.remove(tw`z-1`);

      resolve();
    }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition
  });
}

const isAnimating = ref(false);
function setAnimating(value: boolean) {
  isAnimating.value = value;
  emit("update:isAnimating", value);
}

async function waitAnimation(promise: Promise<unknown>) {
  setAnimating(true);
  await promise;
  setAnimating(false);
}

defineExpose({
  async writeMessage(message: string) {
    await waitAnimation(writeMessage(message));
  },
  moveToPagePair: (index: number) => {
    return waitAnimation(moveToPagePair(index));
  },
  movePagePair: (index: number) => {
    return waitAnimation(movePagePair(index));
  },
  open: () => {
    return waitAnimation(open());
  },
  close: () => {
    return waitAnimation(close());
  },
});
</script>

<template>
  <div
    class="book relative flex h-60 w-80 rounded-lg bg-white perspective-distant transform-3d"
  >
    <div
      ref="coverElement"
      class="cover flex -rotate-y-180 items-center justify-center bg-black text-center text-white"
      :class="[GENERIC_PAGE_CLASSES('right')]"
      :style="{
        transitionDuration: `${FLIPPING_ANIMATION_DURATION}ms`,
      }"
    >
      <slot name="cover">
        <span>Lumi's book</span>
        <span>(but ugly AF)</span>
      </slot>
    </div>
    <div ref="pagesElement" class="absolute h-full w-full transform-3d"></div>
  </div>
</template>
