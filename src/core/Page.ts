import { tw } from "@/utils/tw";
import { FLIPPING_ANIMATION_DURATION } from "./book";
import { createMessageElement } from "./message";

const PAGE_CLASSES = tw`absolute right-0 flex h-full w-1/2 flex-col border bg-white shadow transition-transform backface-hidden transform-3d even:border-l-0`;
const PAGE_SIDE_CLASSES = {
  left: tw`left-0 origin-right rounded-lg rounded-r-none`,
  right: tw`right-0 origin-left rounded-lg rounded-l-none`,
};

const PAGE_CONTENT_CLASSES = tw`page-content grow overflow-auto rounded-lg bg-white p-1`;

type Size = {
  width: number;
  height: number;
};

export type PageSide = "left" | "right";

export class Page {
  public element: HTMLElement;
  public contentElement: HTMLElement;

  constructor(public side: PageSide) {
    this.element = this.createElement();
    this.contentElement = this.createContentElement();

    this.element.appendChild(this.contentElement);
  }

  /**
   * Try to fit the message in the current page.
   * It will return the text that fits (or undefined if nothing fits) and the overflowing text (or undefined if nothing overflowed).
   * It tries to fit the message inside of a clone of the `pageContent` element.
   */
  public tryFittingMessage(words: string[]) {
    const size = {
      width: this.contentElement.clientWidth,
      height: this.contentElement.clientHeight,
    };

    const clonedElement = this.cloneForFitting(size);

    // TODO: create the fake element with the same styles as the real message
    const fakeMessageElement = createMessageElement("white");
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

  public appendChild(element: Element) {
    return this.contentElement.appendChild(element);
  }

  public destroy() {
    this.element.remove();
    this.contentElement.remove();
  }

  private cloneForFitting(size: Size) {
    const clonedElement = this.contentElement.cloneNode(true) as HTMLElement;
    clonedElement.style.visibility = "hidden";
    clonedElement.style.position = "absolute";
    clonedElement.style.left = `-${size.width}px`;
    clonedElement.style.width = `${size.width}px`;
    clonedElement.style.height = `${size.height}px`;
    document.body.appendChild(clonedElement);

    return clonedElement;
  }

  private createElement() {
    const page = document.createElement("div");

    page.classList.add(
      ...PAGE_CLASSES.split(" "),
      ...PAGE_SIDE_CLASSES[this.side].split(" "),
    );
    page.style.transitionDuration = `${FLIPPING_ANIMATION_DURATION}ms`;

    return page;
  }

  private createContentElement() {
    const pageContent = document.createElement("div");
    pageContent.classList.add(...PAGE_CONTENT_CLASSES.split(" "));
    return pageContent;
  }
}
