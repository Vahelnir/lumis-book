import { tw } from "@/utils/tw";
import { typeWriter } from "@/utils/type-writer";
import { wait } from "@/utils/wait";
import { Page } from "./Page";

export const FLIPPING_ANIMATION_DURATION = 1000;

export type MessageProps = { color?: "white" | "gray" };

export class Book {
  leftPage: Page;
  rightPage: Page;

  currentPage: Page;

  previousMessageColor: "white" | "gray" = "gray";

  constructor(private book: HTMLElement) {
    this.prepareBookElement();

    this.leftPage = new Page("left");
    this.rightPage = new Page("right");
    this.book.appendChild(this.leftPage.element);
    this.book.appendChild(this.rightPage.element);

    this.currentPage = this.leftPage;
  }

  private prepareBookElement() {
    for (const child of this.book.children) {
      this.book.removeChild(child);
    }

    this.book.className = tw`relative flex h-60 w-80 rounded-lg bg-white perspective-distant transform-3d`;
  }

  /**
   * Try to fit the message in the current page.
   * It will return the text that fits (or undefined if nothing fits) and the overflowing text (or undefined if nothing overflowed).
   * It tries to fit the message inside of a clone of the `pageContent` element.
   */
  public async tryFittingMessage(page: Page, words: string[]) {
    const pageContent = page.contentElement;
    const size = {
      width: pageContent.clientWidth,
      height: pageContent.clientHeight,
    };

    const clonedElement = pageContent.cloneNode(true) as HTMLElement;
    clonedElement.style.visibility = "hidden";
    clonedElement.style.position = "absolute";
    clonedElement.style.left = `-${size.width}px`;
    clonedElement.style.width = `${size.width}px`;
    clonedElement.style.height = `${size.height}px`;
    document.body.appendChild(clonedElement);

    // TODO: create the fake element with the same styles as the real message
    const fakeMessageElement = createMessageElement();
    fakeMessageElement.textContent = words[0] + " ";
    clonedElement.appendChild(fakeMessageElement);

    if (clonedElement.scrollHeight > clonedElement.clientHeight) {
      return { text: undefined, overflowingText: words.join(" ") };
    }

    for (let index = 1; index < words.length; index++) {
      const word = words[index];
      fakeMessageElement.textContent += word + " ";

      if (clonedElement.scrollHeight <= clonedElement.clientHeight) {
        continue;
      }

      clonedElement.remove();

      return {
        text: fakeMessageElement.textContent?.slice(0, -(word.length + 1)),
        overflowingText: "... " + words.slice(index).join(" "),
      };
    }

    clonedElement.remove();

    return { text: fakeMessageElement.textContent, overflowingText: undefined };
  }

  public async writeMessage(
    message: string,
    receivedMessageProps?: MessageProps,
  ): Promise<void> {
    if (receivedMessageProps?.color) {
      this.previousMessageColor = receivedMessageProps.color;
    } else {
      this.previousMessageColor =
        this.previousMessageColor === "gray" ? "white" : "gray";
    }

    const usedMessageProps = {
      color: this.previousMessageColor,
      ...receivedMessageProps,
    };

    const { text, overflowingText } = await this.tryFittingMessage(
      this.currentPage,
      message.split(" "),
    );
    if (!text) {
      await this.nextPage();
      await this.writeMessage(message, usedMessageProps);
      return;
    }

    const messageElement = createMessageElement(usedMessageProps);
    this.currentPage.appendChild(messageElement);

    messageElement.textContent = "";
    await typeWriter(text, (letter) => {
      messageElement.textContent += letter;
    });

    if (overflowingText) {
      await this.nextPage(true);
      await this.writeMessage(overflowingText, usedMessageProps);
      return;
    }
  }

  public async nextPage(isContinuingWriting = false) {
    if (this.currentPage === this.rightPage) {
      // If we reach the end of the right page, and still have stuff to write
      if (isContinuingWriting) {
        await wait(2000);
      }

      await this.flipPage();
      this.currentPage = this.leftPage;
      return;
    }

    this.currentPage = this.rightPage;
  }

  public async flipPage() {
    const oldLeftPage = this.leftPage;
    const oldRightPage = this.rightPage;

    this.leftPage = new Page("left");
    this.rightPage = new Page("right");

    this.book.appendChild(this.leftPage.element);
    this.book.appendChild(this.rightPage.element);

    // flip previous right page to the left
    oldRightPage.element.classList.add(tw`-rotate-y-180`);
    // force the new leftPage to be flipped OVER the current right page
    this.leftPage.element.classList.add(tw`rotate-y-180`);

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    this.leftPage.element.classList.remove(tw`rotate-y-180`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // hide the old pages (we could remove them from the dom too)
        oldLeftPage.element.classList.add("hidden");
        oldRightPage.element.classList.add("hidden");

        resolve();
      }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition time
    });
  }

  destroy() {
    this.book.innerHTML = "";
    // TODO: clear all intervals (maybe use an AbortController?)
  }
}

function nextRepaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

function createMessageElement(props?: MessageProps) {
  const options = { color: "white", ...props };

  const messageBlock = document.createElement("div");
  messageBlock.classList.add(
    ...tw`message rounded p-1 backface-hidden`.split(" "),
  );
  if (options.color === "gray") {
    messageBlock.classList.add(tw`bg-gray-200`);
  }

  return messageBlock;
}
