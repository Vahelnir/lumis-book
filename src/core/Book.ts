import { tw } from "@/utils/tw";
import { wait } from "@/utils/wait";
import { Page } from "./page";
import { type Message } from "./message";

export const FLIPPING_ANIMATION_DURATION = 1000;

export type MessageProps = { color?: "white" | "gray" };

export class Book {
  pages: Page[] = [];

  _currentPairIndex = 0;

  currentWritingPage: Page;

  previousMessageColor: Message["color"] = "gray";

  constructor(
    private book: HTMLElement,
    private events: {
      onCurrentPairChange: (currentPairIndex: number) => void;
      onPageCreation: (pages: Page[], pair: [Page, Page]) => void;
    },
  ) {
    this.prepareBookElement();

    const [left, right] = this.createPagePair();
    left.mount(this.book);
    right.mount(this.book);
    this.currentWritingPage = left;

    this.currentPairIndex = 0;
  }

  get currentPairIndex() {
    return this._currentPairIndex;
  }

  set currentPairIndex(index: number) {
    this._currentPairIndex = index;
    this.events?.onCurrentPairChange(index);
  }

  public async focusPage(page: Page) {
    const pageIndex = this.pages.indexOf(page);
    const pairIndex = Math.floor(pageIndex / 2);
    await this.moveToPagePair(pairIndex);
  }

  public async moveToPagePair(index: number) {
    const offset = index - this.currentPairIndex;
    await this.movePagePair(offset);
  }

  public async movePagePair(offset: number) {
    if (offset === 0) {
      return;
    }

    const targetPair = this.getPair(this.currentPairIndex + offset);
    if (!targetPair) {
      return;
    }

    targetPair.map((page) => page.mount(this.book));

    const [oldLeftPage, oldRightPage] = this.currentPair;
    if (offset > 0) {
      const [leftPage] = targetPair;
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

        this.currentPairIndex += offset;

        resolve();
      }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition time
    });
  }

  public async writeMessage(
    message: string,
    color?: Message["color"],
  ): Promise<void> {
    if (!this.currentPair.includes(this.currentWritingPage)) {
      await this.focusPage(this.currentWritingPage);
    }

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
      await this.moveWritingPage();
      await this.writeMessage(message, this.previousMessageColor);
      return;
    }

    await this.currentWritingPage.writeMessage({
      text,
      color: this.previousMessageColor,
    });

    if (overflowingText) {
      await this.moveWritingPage(true);
      await this.writeMessage(overflowingText, this.previousMessageColor);
      return;
    }
  }

  public async moveWritingPage(isContinuingWriting = false) {
    if (this.currentWritingPage.side === "right") {
      // If we reach the end of the right page, and still have stuff to write
      if (isContinuingWriting) {
        await wait(2000);
      }

      this.createPagePair();

      await this.movePagePair(1);
      this.currentWritingPage = this.currentPair[0];
      return;
    }

    this.currentWritingPage = this.currentPair[1];
  }

  public destroy() {
    for (const page of this.pages) {
      page.destroy();
    }

    this.book.innerHTML = "";
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
    const left = this.pages[pageIndex];
    const right = this.pages[pageIndex + 1];
    if (!left || !right) {
      return undefined;
    }

    return [left, right];
  }

  private createPagePair(): [Page, Page] {
    const leftPage = new Page("left");
    const rightPage = new Page("right");

    this.pages.push(leftPage, rightPage);
    this.events?.onPageCreation(this.pages, [leftPage, rightPage]);
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
