import { tw } from "@/utils/tw";
import { typeWriter } from "@/utils/type-writer";
import { wait } from "@/utils/wait";
import { Page } from "./page";
import { createMessageElement, type Message } from "./message";

export const FLIPPING_ANIMATION_DURATION = 1000;

export type MessageProps = { color?: "white" | "gray" };

export class Book {
  leftPage: Page;
  rightPage: Page;

  currentWritingPage: Page;

  previousMessageColor: Message["color"] = "gray";

  constructor(private book: HTMLElement) {
    this.prepareBookElement();

    this.leftPage = new Page("left");
    this.rightPage = new Page("right");
    this.book.appendChild(this.leftPage.element);
    this.book.appendChild(this.rightPage.element);

    this.currentWritingPage = this.leftPage;
  }

  private prepareBookElement() {
    for (const child of this.book.children) {
      this.book.removeChild(child);
    }

    this.book.className = tw`relative flex h-60 w-80 rounded-lg bg-white perspective-distant transform-3d`;
  }

  public async writeMessage(
    message: string,
    color?: Message["color"],
  ): Promise<void> {
    if (color) {
      this.previousMessageColor = color;
    } else {
      this.previousMessageColor =
        this.previousMessageColor === "gray" ? "white" : "gray";
    }

    const { text, overflowingText } = this.currentWritingPage.tryFittingMessage(
      message.split(" "),
    );
    if (!text) {
      await this.nextPage();
      await this.writeMessage(message, color);
      return;
    }

    const messageElement = createMessageElement(this.previousMessageColor);
    this.currentWritingPage.appendChild(messageElement);

    messageElement.textContent = "";
    await typeWriter(text, (letter) => {
      messageElement.textContent += letter;
    });

    if (overflowingText) {
      await this.nextPage(true);
      await this.writeMessage(overflowingText, color);
      return;
    }
  }

  public async nextPage(isContinuingWriting = false) {
    if (this.currentWritingPage === this.rightPage) {
      // If we reach the end of the right page, and still have stuff to write
      if (isContinuingWriting) {
        await wait(2000);
      }

      await this.flipPage();
      this.currentWritingPage = this.leftPage;
      return;
    }

    this.currentWritingPage = this.rightPage;
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
