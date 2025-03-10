<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from "vue";
import { Book } from "@/core/Book";

type Message = {
  id: number;
  text: string;
  color: "white" | "gray";
};
type PageState = {
  index: number;
  messages: Message[];
  flipping: boolean;
  element?: HTMLElement;
};

const pages = ref<PageState[]>([
  {
    index: 0,
    messages: [],
    flipping: false,
  },
]);
const currentPageIndex = ref(0);
const lastMessage = ref<Message>();

const FLIPPING_ANIMATION_DURATION = 1000;

const visiblePages = computed(() => {
  if (isLeftPage(getPage())) {
    return [currentPageIndex.value, currentPageIndex.value + 1];
  }

  return [currentPageIndex.value - 1, currentPageIndex.value];
});

async function addMessage(textContent: string, color?: "white" | "gray") {
  if (!color && lastMessage.value?.color) {
    color = lastMessage.value.color === "gray" ? "white" : "gray";
  }

  color ??= "white";

  const words = textContent.split(" ");

  const message = reactive({
    id: (lastMessage.value?.id ?? 0) + 1,
    text: words[0] + " ",
    color,
  } satisfies Message);

  const currentPage = getCurrentPage();
  currentPage.messages.push(message);
  // await 1 tick to let the DOM update
  await nextTick();

  // TODO: see if it is possible to work with a clone of the element
  const originalPageContent = currentPage.element?.querySelector(
    "[data-book-page-content]",
  );
  const currentPageContent = originalPageContent?.cloneNode(true);
  if (
    !originalPageContent ||
    !currentPageContent ||
    !(currentPageContent instanceof HTMLElement)
  ) {
    throw new Error(`No page element found in page '${currentPage.index}''`);
  }

  currentPageContent.style.visibility = "hidden";
  currentPageContent.style.height = originalPageContent.clientHeight + "px";
  currentPageContent.style.width = originalPageContent.clientWidth + "px";
  document.body.appendChild(currentPageContent);

  const { text, overflowingText } = tryFitMessage(currentPageContent, words);

  if (!text) {
    // remove the added message because it doesn't fit
    currentPage.messages.pop();

    await nextPage();

    return addMessage(textContent, color);
  }

  // update the message to the right text
  lastMessage.value = message;
  message.text = "";

  await typeWriter(text, (letter) => {
    message.text += letter;
  });

  if (overflowingText) {
    await nextPage();
    return addMessage(overflowingText, color);
  }
}

function seconds(seconds: number) {
  return new Promise<void>((resolve) =>
    setTimeout(() => resolve(), seconds * 1000),
  );
}

function typeWriter(text: string, func: (letter: string) => void) {
  return new Promise<void>((resolve) => {
    let index = 0;
    const intervalId = setInterval(async () => {
      func(text[index++]);

      if (intervalId && index >= text.length) {
        clearInterval(intervalId);
        resolve();
      }
    }, 40);
  });
}

function tryFitMessage(pageContent: HTMLElement, words: string[]) {
  if (pageContent.scrollHeight > pageContent.clientHeight) {
    return { text: undefined, overflowingText: words.join(" ") };
  }

  const messageElement = pageContent.children[pageContent.children.length - 1];
  messageElement.textContent = words[0] + " ";
  for (let index = 1; index < words.length; index++) {
    const word = words[index];
    messageElement.textContent += word + " ";

    if (pageContent.scrollHeight <= pageContent.clientHeight) {
      continue;
    }

    return {
      text: messageElement.textContent?.slice(0, -(word.length + 1)),
      overflowingText: "... " + words.slice(index).join(" "),
    };
  }

  return { text: messageElement.textContent, overflowingText: undefined };
}

async function nextPage() {
  const currentPage = getCurrentPage();
  const newPage: PageState = {
    index: currentPage.index + 1,
    messages: [],
    flipping: false,
  };
  pages.value.push(newPage);

  const mustFlip = isLeftPage(newPage);

  if (mustFlip) {
    await seconds(2);
    currentPage.flipping = true;
    newPage.flipping = true;
  }
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  currentPageIndex.value++;
  if (mustFlip) {
    await new Promise<void>((resolve) =>
      setTimeout(() => resolve(), FLIPPING_ANIMATION_DURATION),
    );
    currentPage.flipping = false;
    newPage.flipping = false;
  } else {
    await nextTick();
  }
}

function getPage(index: number = 0) {
  const page = pages.value[currentPageIndex.value + index];
  if (!page) {
    throw new Error(
      `No page found at index '${currentPageIndex.value + index}'`,
    );
  }

  return page;
}

function getCurrentPage() {
  return getPage();
}

function isLeftPage(page: PageState) {
  return page.index % 2 === 0;
}

/** VanillaJS way */
const bookElement = useTemplateRef("bookElement");
let book: Book | undefined;
watch(bookElement, async (element, _, onCleanup) => {
  if (!element) {
    return;
  }

  book = new Book(element);

  onCleanup(() => book?.destroy());
});

const disableButton = ref(false);
async function addMessageEvent() {
  if (!book) {
    return;
  }

  const messages = [
    "Lorem ipsum dolor sit amet, consectetur.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  disableButton.value = true;
  await Promise.all([book.addMessage(message), addMessage(message)]);
  disableButton.value = false;
}
</script>

<template>
  <div class="relative flex h-60 w-80 rounded-lg bg-white perspective-distant">
    <div
      v-for="page in pages"
      :key="page.index"
      :ref="(element) => (page.element = element as HTMLElement)"
      class="absolute right-0 flex h-full w-1/2 flex-col border bg-white shadow transition-transform backface-hidden transform-3d even:border-l-0"
      :style="{ transitionDuration: `${FLIPPING_ANIMATION_DURATION}ms` }"
      :class="[
        {
          'left-0 origin-right rounded-lg rounded-r-none': isLeftPage(page),
          'right-0 origin-left rounded-lg rounded-l-none': !isLeftPage(page),
          'rotate-y-180': isLeftPage(page) && page.index > visiblePages[1],
          '-rotate-y-180': !isLeftPage(page) && page.index < visiblePages[0],
          hidden:
            visiblePages[0] - 2 > page.index ||
            page.index > visiblePages[1] + 2,
        },
      ]"
    >
      <div class="page-content grow overflow-auto p-1" data-book-page-content>
        <div
          v-for="message in page.messages"
          :key="message.id"
          class="rounded p-1 backface-hidden"
          :class="{
            'bg-white': message.color === 'white',
            'bg-gray-200': message.color === 'gray',
          }"
        >
          {{ message.text }}
        </div>
      </div>
    </div>
  </div>
  <div class="h-10"></div>
  <div ref="bookElement"></div>
  <button
    class="rounded border px-4 py-2"
    :disabled="disableButton"
    @click="addMessageEvent"
  >
    Add message
  </button>
</template>
