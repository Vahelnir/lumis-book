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

const isOpened = ref(false);
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
createPagePair(true);
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
  if (!isOpened.value) {
    await open();
  }

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

  if (!isOpened.value) {
    currentPair.value.forEach((page) => page.unmount());
    currentPairIndex.value += offset;
    currentPair.value[0].flipped = true;
    currentPair.value[0].hidden = true;
    targetPair.map((page) => page.mount(mountingElement));

    return open();
  }

  targetPair.map((page) => {
    page.hidden = false;
    page.mount(mountingElement);
  });
  const [oldLeftPage, oldRightPage] = currentPair.value;
  if (offset > 0) {
    const [leftPage] = targetPair;

    // make both pages be on top of every other page to avoid
    // the flicker effect that happens when the old right page
    // goes over the new left page
    oldRightPage.element?.classList.add(tw`z-1`);
    leftPage.element?.classList.add(tw`z-1`);

    // flip previous right page to the left
    oldRightPage.flipped = true;
    oldRightPage.update();
    // force the new leftPage to be flipped OVER the current right page
    leftPage.flipped = true;
    leftPage.update();

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    leftPage.flipped = false;
    leftPage.update();
  } else {
    const [, rightPage] = targetPair;

    // make both pages be on top of every other page
    oldLeftPage.element?.classList.add(tw`z-1`);
    rightPage.element?.classList.add(tw`z-1`);
    // flip previous right page to the left
    oldLeftPage.flipped = true;
    oldLeftPage.update();
    // force the new leftPage to be flipped OVER the current right page
    rightPage.flipped = true;
    rightPage.update();

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    rightPage.flipped = false;
    rightPage.update();
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

function createPagePair(initial = false): [Page, Page] {
  const leftPage = new Page("left");
  const rightPage = new Page("right");

  if (initial) {
    leftPage.flipped = true;
    leftPage.hidden = true;

    rightPage.hidden = true;
  }

  pages.value.push(leftPage, rightPage);
  emit("update:pages", pages.value);
  emit("update:pairCount", Math.round(pages.value.length / 2));
  return [leftPage, rightPage];
}

async function open() {
  if (isOpened.value) {
    return;
  }

  isOpened.value = true;

  const [leftPage, rightPage] = currentPair.value;

  // display the left page
  leftPage.hidden = false;
  leftPage.update();

  await nextRepaint();

  // flip the cover and the left page
  leftPage.flipped = false;
  leftPage.update();
  cover.value?.classList.add(tw`-rotate-y-180`);

  await nextRepaint();

  // then display the right page
  rightPage.hidden = false;
  rightPage.update();

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition
  });
}

async function close() {
  if (!isOpened.value) {
    return;
  }

  const [leftPage, rightPage] = currentPair.value;

  // make both pages be on top of every other page to avoid
  // the flicker effect that happens when the old right page
  // goes over the new left page
  // TODO: manage this state inside of the Page class directly
  cover.value?.classList.add(tw`z-1`);
  leftPage.element?.classList.add(tw`z-1`);

  cover.value?.classList.remove(tw`-rotate-y-180`);
  leftPage.flipped = true;
  leftPage.update();

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      leftPage.hidden = true;
      leftPage.update();
      rightPage.hidden = true;
      rightPage.update();

      cover.value?.classList.remove(tw`z-1`);
      leftPage.element?.classList.remove(tw`z-1`);

      isOpened.value = false;

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
      class="cover flex items-center justify-center bg-black text-center text-white"
      :class="[
        GENERIC_PAGE_CLASSES('right'),
        {
          'z-1': !isOpened,
        },
      ]"
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
