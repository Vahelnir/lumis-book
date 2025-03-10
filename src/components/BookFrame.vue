<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { Book } from "@/core/Book";

type Message = {
  id: number;
  text: string;
  color: "white" | "gray";
};
type PageState = {
  index: number;
  messages: Message[];
  side: "left" | "right";
  flipping: boolean;
  element?: HTMLElement;
};

const pages = ref<PageState[]>([
  {
    index: 0,
    messages: [],
    side: "left",
    flipping: false,
  },
]);
const currentPageIndex = ref(0);
const lastMessage = ref<Message>();

const FLIPPING_ANIMATION_DURATION = 1000;

const visiblePages = computed(() => {
  if (currentPageIndex.value % 2 === 0) {
    return [currentPageIndex.value, currentPageIndex.value + 1];
  }

  return [currentPageIndex.value - 1, currentPageIndex.value];
});

async function addMessage(text: string, color?: "white" | "gray") {
  if (!color && lastMessage.value?.color) {
    color = lastMessage.value.color === "gray" ? "white" : "gray";
  }

  color ??= "white";

  const words = text.split(" ");

  const message = {
    id: (lastMessage.value?.id ?? 0) + 1,
    text: words[0] + " ",
    color,
  } satisfies Message;

  const currentPage = getCurrentPage();
  currentPage.messages.push(message);
  // await 1 tick to let the DOM update
  await nextTick();

  // TODO: see if it is possible to work with a clone of the element
  const currentPageContent = currentPage.element?.querySelector(
    "[data-book-page-content]",
  );
  if (!currentPageContent || !(currentPageContent instanceof HTMLElement)) {
    throw new Error(`No page element found in page '${currentPage.index}''`);
  }

  if (currentPageContent.scrollHeight > currentPageContent.clientHeight) {
    // remove the added message because it doesn't fit
    currentPage.messages.pop();

    await nextPage();

    return addMessage(text, color);
  }

  lastMessage.value = message;

  const messageElement =
    currentPageContent.children[currentPageContent.children.length - 1];
  for (let index = 1; index < words.length; index++) {
    const word = words[index];
    messageElement.innerHTML += word + " ";
    if (currentPageContent.scrollHeight <= currentPageContent.clientHeight) {
      continue;
    }

    message.text = messageElement.innerHTML.slice(0, -(word.length + 1));

    const overflowText = words.slice(index).join(" ");
    console.log("overflowText", overflowText);
    await nextPage();
    return addMessage("... " + overflowText, color);
  }
}

async function nextPage() {
  const currentPage = getCurrentPage();
  const newPage: PageState = {
    index: currentPage.index + 1,
    messages: [],
    side: currentPage.side === "left" ? "right" : "left",
    flipping: false,
  };
  pages.value.push(newPage);

  const mustFlip = newPage.side === "left";

  if (mustFlip) {
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

  const message = "Ahah merci, bienvenue par ici ! :D";

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
          'left-0 origin-right rounded-lg rounded-r-none': page.side === 'left',
          'right-0 origin-left rounded-lg rounded-l-none':
            page.side === 'right',
          '-rotate-y-180':
            page.side === 'right' && page.index < visiblePages[0],
          'rotate-y-180': page.side === 'left' && page.index > visiblePages[1],
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
