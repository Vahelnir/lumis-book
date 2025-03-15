import { tw } from "@/utils/tw";
import { wait } from "@/utils/wait";
import { Page, PAGE_CLASSES, PAGE_SIDE_CLASSES } from "./page";
import { type Message } from "./message";

export const FLIPPING_ANIMATION_DURATION = 1000;

export type MessageProps = { color?: "white" | "gray" };

export class Book {
  pages: Page[] = [];
  cover?: HTMLElement;

  _currentPairIndex = 0;

  currentWritingPage: Page;

  previousMessageColor: Message["color"] = "gray";
  pagesElement?: HTMLDivElement;

  constructor(
    private book: HTMLElement,
    private events: {
      onCurrentPairChange: (currentPairIndex: number) => void;
      onPageCreation: (pages: Page[], pair: [Page, Page]) => void;
    },
  ) {
    this.prepareBookElement();

    const pagesElement = this.pagesElement;
    if (!pagesElement) {
      throw new Error("No pages element found while constructing the book");
    }

    const [left, right] = this.createPagePair();
    left.mount(pagesElement);
    right.mount(pagesElement);
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
    const pagesElement = this.pagesElement;
    if (!pagesElement) {
      throw new Error("No pages element found");
    }

    if (offset === 0) {
      return;
    }

    const targetPair = this.getPair(this.currentPairIndex + offset);
    if (!targetPair) {
      return;
    }

    targetPair.map((page) => page.mount(pagesElement));

    const [oldLeftPage, oldRightPage] = this.currentPair;
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

    const { text, overflowingText } =
      this.currentWritingPage.tryFittingMessage(message);
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

  public async open() {
    if (!this.cover) {
      throw new Error("No covers found");
    }

    const [leftPage, rightPage] = this.currentPair;

    // display the left page
    leftPage.element?.classList.remove(tw`hidden`);

    await nextRepaint();

    // flip the cover and the left page
    leftPage.element?.classList.remove(tw`rotate-y-180`);
    this.cover.classList.add(tw`-rotate-y-180`);

    await nextRepaint();

    // then display the right page
    rightPage.element?.classList.remove(tw`hidden`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition
    });
  }

  public async close() {
    if (!this.cover) {
      throw new Error("No covers found");
    }

    const [leftPage, rightPage] = this.currentPair;

    // make both pages be on top of every other page to avoid
    // the flicker effect that happens when the old right page
    // goes over the new left page
    this.cover.classList.add(tw`z-1`);
    leftPage.element?.classList.add(tw`z-1`);

    this.cover.classList.remove(tw`-rotate-y-180`);
    leftPage.element?.classList.add(tw`rotate-y-180`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        leftPage.element?.classList.add(tw`hidden`);
        rightPage.element?.classList.add(tw`hidden`);
        this.cover?.classList.remove(tw`z-1`);
        leftPage.element?.classList.remove(tw`z-1`);

        resolve();
      }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition
    });
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

  private createPagesElement() {
    const pagesElement = document.createElement("div");
    pagesElement.className = tw`absolute h-full w-full transform-3d`;

    return pagesElement;
  }

  private prepareBookElement() {
    for (const child of this.book.children) {
      this.book.removeChild(child);
    }

    this.pagesElement = this.createPagesElement();
    this.cover = this.createCover();

    this.book.appendChild(this.cover);
    this.book.appendChild(this.pagesElement);

    this.book.className = tw`relative flex h-60 w-80 rounded-lg bg-white perspective-distant transform-3d`;
  }

  private createCover() {
    const cover = document.createElement("div");
    cover.classList.add(
      ...PAGE_CLASSES.split(" "),
      ...PAGE_SIDE_CLASSES["right"].split(" "),
      tw`-rotate-y-180`,
    );

    cover.style.background = "black";
    cover.style.color = "white";
    cover.style.transitionDuration = `${FLIPPING_ANIMATION_DURATION}ms`;

    cover.textContent = "Cover";

    return cover;
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
