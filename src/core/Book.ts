import { tw } from "@/utils/tw";
import { wait } from "@/utils/wait";
import { Page } from "./page";
import { type Message } from "./message";

export const FLIPPING_ANIMATION_DURATION = 1000;

export type MessageProps = { color?: "white" | "gray" };

export class Book {
  pages: Page[] = [];

  currentPairIndex = 0;

  currentWritingPage: Page;

  previousMessageColor: Message["color"] = "gray";

  constructor(private book: HTMLElement) {
    this.prepareBookElement();

    const [left, right] = this.createPagePair();
    this.book.appendChild(left.element);
    this.book.appendChild(right.element);
    this.currentWritingPage = left;

    this.currentPairIndex = 0;
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
      await this.writeMessage(message, this.previousMessageColor);
      return;
    }

    await this.currentWritingPage.writeMessage({
      text,
      color: this.previousMessageColor,
    });

    if (overflowingText) {
      await this.nextPage(true);
      await this.writeMessage(overflowingText, this.previousMessageColor);
      return;
    }
  }

  public async nextPage(isContinuingWriting = false) {
    if (this.currentWritingPage.side === "right") {
      // If we reach the end of the right page, and still have stuff to write
      if (isContinuingWriting) {
        await wait(2000);
      }

      await this.flipPage();
      this.currentWritingPage = this.currentPair[0];
      return;
    }

    this.currentWritingPage = this.currentPair[1];
  }

  public async flipPage() {
    const [oldLeftPage, oldRightPage] = this.currentPair;

    const [leftPage, rightPage] = this.createPagePair();
    this.book.appendChild(leftPage.element);
    this.book.appendChild(rightPage.element);
    this.currentPairIndex++;

    // flip previous right page to the left
    oldRightPage.element.classList.add(tw`-rotate-y-180`);
    // force the new leftPage to be flipped OVER the current right page
    leftPage.element.classList.add(tw`rotate-y-180`);

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    leftPage.element.classList.remove(tw`rotate-y-180`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // hide the old pages (we could remove them from the dom too)
        oldLeftPage.destroy();
        oldRightPage.destroy();

        resolve();
      }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition time
    });
  }

  public destroy() {
    this.book.innerHTML = "";
    // TODO: clear all intervals (maybe use an AbortController?)
  }

  private get currentPair() {
    const pair = this.getPair(this.currentPairIndex);
    if (!pair) {
      throw new Error(
        `No pair of pages found at pair current index ${this.currentPairIndex}`,
      );
    }

    return pair;
  }

  private getPair(index: number): [Page, Page] | undefined {
    const pageIndex = index * 2;
    if (this.pages.length <= pageIndex) {
      return undefined;
    }

    return [this.pages[pageIndex], this.pages[pageIndex + 1]];
  }

  private createPagePair(): [Page, Page] {
    const leftPage = new Page("left");
    const rightPage = new Page("right");

    this.pages.push(leftPage, rightPage);
    return [leftPage, rightPage];
  }

  private prepareBookElement() {
    for (const child of this.book.children) {
      this.book.removeChild(child);
    }

    this.book.className = tw`relative flex h-60 w-80 rounded-lg bg-white perspective-distant transform-3d`;
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
