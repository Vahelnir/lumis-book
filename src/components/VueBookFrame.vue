<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from "vue";

import { FLIPPING_ANIMATION_DURATION } from "@/core/book";
import type { Message } from "@/core/message";
import { GENERIC_PAGE_CLASSES } from "@/core/page";
import { nextRepaint } from "@/utils/nextRepaint";
import { tw } from "@/utils/tw";
import { wait } from "@/utils/wait";

import BookPage, { type PageState } from "./BookPage.vue";

export type Page = {
  state: PageState;
  shouldMount: boolean;
  element: InstanceType<typeof BookPage> | undefined;
};

const emit = defineEmits<{
  isAnimating: [isBusy: boolean];
  currentPairIndexChange: [currentPairIndex: number];
  pagesChange: [pages: Page[]];
  pairCountChange: [pairCount: number];
}>();

const isOpened = ref(false);
const cover = useTemplateRef("coverElement");

const previousMessageColor = ref<Message["color"]>("gray");

const _currentPairIndex = ref(0);
const currentPairIndex = computed({
  get: () => _currentPairIndex.value,
  set: (value: number) => {
    _currentPairIndex.value = value;
    emit("currentPairIndexChange", value);
  },
});

const pages = ref<Page[]>([]);
createPagePair(true);
const currentWritingPage = ref<Page>(pages.value[0]);

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

onMounted(() => {
  const [left, right] = currentPair.value;
  left.shouldMount = true;
  right.shouldMount = true;
});

async function writeMessage(
  message: string,
  color?: Message["color"],
): Promise<void> {
  if (!currentPair.value.includes(currentWritingPage.value)) {
    await focusPage(currentWritingPage.value);
  }

  if (!isOpened.value) {
    await open();
  }

  if (!currentWritingPage.value.element) {
    throw new Error("Page element is not available");
  }

  if (color) {
    previousMessageColor.value = color;
  } else {
    previousMessageColor.value =
      previousMessageColor.value === "gray" ? "white" : "gray";
  }

  const { text, overflowingText } =
    currentWritingPage.value.element.tryFittingMessage(message);
  if (!text) {
    await moveWritingPage();
    await writeMessage(message, previousMessageColor.value);
    return;
  }

  currentWritingPage.value.state.messages.push({
    text,
    color: previousMessageColor.value,
    writing: true,
  });

  // TODO: this is hacky af, but it works for now. We should find a better way to do this
  await new Promise<void>((resolve) => {
    const checkIfWritingIsDone = () => {
      if (
        currentWritingPage.value.state.messages.every(
          (message) => !message.writing,
        )
      ) {
        resolve();
      } else {
        requestAnimationFrame(checkIfWritingIsDone);
      }
    };
    requestAnimationFrame(checkIfWritingIsDone);
  });

  if (overflowingText) {
    await moveWritingPage(true);
    await writeMessage(overflowingText, previousMessageColor.value);
    return;
  }
}

async function moveWritingPage(isContinuingWriting = false) {
  if (currentWritingPage.value.state.side === "right") {
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
  if (offset === 0) {
    return;
  }

  const targetPair = getPair(currentPairIndex.value + offset);
  if (!targetPair) {
    return;
  }

  if (!isOpened.value) {
    currentPair.value.forEach((page) => (page.shouldMount = false));
    await nextTick();

    currentPairIndex.value += offset;
    currentPair.value[0].state.flipped = true;
    currentPair.value[0].state.hidden = true;
    currentPair.value[0].shouldMount = true;

    currentPair.value[1].state.hidden = true;
    currentPair.value[1].state.flipped = false;
    currentPair.value[1].shouldMount = true;

    await nextTick();

    return open();
  }

  targetPair.map((page) => {
    page.state.hidden = false;
    page.shouldMount = true;
  });
  await nextTick();

  const [oldLeftPage, oldRightPage] = currentPair.value;
  if (offset > 0) {
    const [leftPage] = targetPair;

    // flip previous right page to the left
    oldRightPage.state.inFront = true;
    oldRightPage.state.flipped = true;
    // force the new leftPage to be flipped OVER the current right page
    leftPage.state.inFront = true;
    leftPage.state.flipped = true;

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    leftPage.state.flipped = false;
  } else {
    const [, rightPage] = targetPair;

    // flip previous right page to the left
    oldLeftPage.state.inFront = true;
    oldLeftPage.state.flipped = true;
    // force the new leftPage to be flipped OVER the current right page
    rightPage.state.inFront = true;
    rightPage.state.flipped = true;

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    rightPage.state.flipped = false;
  }

  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      currentPair.value.forEach((page) => (page.state.inFront = false));
      targetPair.forEach((page) => (page.state.inFront = false));

      // hide the old pages (we could remove them from the dom too)
      oldLeftPage.shouldMount = false;
      oldRightPage.shouldMount = false;
      await nextTick();

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
  const leftPage: Page = {
    state: {
      flipped: false,
      hidden: false,
      inFront: false,
      messages: [],
      side: "left",
    },
    shouldMount: false,
    element: undefined,
  };
  const rightPage: Page = {
    state: {
      flipped: false,
      hidden: false,
      inFront: false,
      messages: [],
      side: "right",
    },
    shouldMount: false,
    element: undefined,
  };

  if (initial) {
    leftPage.state.flipped = true;
    leftPage.state.hidden = true;

    rightPage.state.hidden = true;
  }

  pages.value.push(leftPage, rightPage);
  emit("pagesChange", pages.value);
  emit("pairCountChange", Math.round(pages.value.length / 2));
  return [leftPage, rightPage];
}

async function open() {
  if (isOpened.value) {
    return;
  }

  isOpened.value = true;

  const [leftPage, rightPage] = currentPair.value;

  // display the left page
  leftPage.state.hidden = false;
  await nextRepaint();

  // flip the cover and the left page
  leftPage.state.flipped = false;
  cover.value?.classList.add(tw`-rotate-y-180`);

  await nextRepaint();

  // then display the right page
  rightPage.state.hidden = false;

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
  leftPage.state.inFront = true;

  cover.value?.classList.remove(tw`-rotate-y-180`);
  leftPage.state.flipped = true;

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      leftPage.state.hidden = true;
      rightPage.state.hidden = true;

      cover.value?.classList.remove(tw`z-1`);
      leftPage.state.inFront = false;
      isOpened.value = false;

      resolve();
    }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition
  });
}

const isAnimating = ref(false);
function setAnimating(value: boolean) {
  isAnimating.value = value;
  emit("isAnimating", value);
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
    <div class="absolute h-full w-full transform-3d">
      <template v-for="(page, index) in pages">
        <BookPage
          v-if="page.shouldMount"
          :ref="(el) => (page.element = el as InstanceType<typeof BookPage>)"
          :key="index"
          v-model:state="page.state"
        />
      </template>
    </div>
  </div>
</template>
