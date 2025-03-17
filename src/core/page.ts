import { tw } from "@/utils/tw";
import { FLIPPING_ANIMATION_DURATION } from "./book";
import { createMessageElement, type Message } from "./message";
import { typeWriter } from "@/utils/type-writer";

const SIDE_CLASSES = {
  left: tw`left-0 origin-right rounded-lg rounded-r-none`,
  right: tw`right-0 origin-left rounded-lg rounded-l-none`,
};
export const GENERIC_PAGE_CLASSES = (side: "left" | "right") => {
  return [
    tw`absolute right-0 flex h-full w-1/2 flex-col transition-transform backface-hidden transform-3d`,
    SIDE_CLASSES[side],
  ].join(" ");
};

export const PAGE_CLASSES = (side: "left" | "right") =>
  [
    `page--${side}`,
    tw`page border bg-white shadow`,
    GENERIC_PAGE_CLASSES(side),
  ].join(" ");

const PAGE_CONTENT_CLASSES = tw`page-content grow overflow-auto rounded-lg p-1`;

type Size = {
  width: number;
  height: number;
};

export type PageSide = "left" | "right";

export class Page {
  public element?: HTMLElement;
  public contentElement?: HTMLElement;

  public messages: Message[] = [];
  public hidden = false;
  public flipped = false;
  public inFront = false;

  constructor(public side: PageSide) {}

  private getContentElementOrFail() {
    if (!this.contentElement) {
      throw new Error("Content element is not defined");
    }

    return this.contentElement;
  }

  /**
   * Try to fit the message in the current page.
   * It will return the text that fits (or undefined if nothing fits) and the overflowing text (or undefined if nothing overflowed).
   * It tries to fit the message inside of a clone of the `pageContent` element.
   */
  public tryFittingMessage(text: string) {
    const contentElement = this.getContentElementOrFail();
    const size = {
      width: contentElement.clientWidth,
      height: contentElement.clientHeight,
    };

    const clonedElement = this.cloneForFitting(size);

    // TODO: find a way to properly break the words if too long
    const words = text.split(" ");

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
        if (word.length > 10) {
        }
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

  public async writeMessage(message: Message) {
    this.messages.push(message);

    const messageElement = this.addMessage(message);

    messageElement.textContent = "";
    await typeWriter(message.text, (letter) => {
      messageElement.textContent += letter;
    });
  }

  public update() {
    if (!this.element) {
      return;
    }

    this.updateClasses(this.element);
  }

  public mount(parent: HTMLElement) {
    this.element = this.createElement();
    this.contentElement = this.createContentElement();

    for (const message of this.messages) {
      this.addMessage(message);
    }

    this.element.appendChild(this.contentElement);

    parent.appendChild(this.element);
  }

  public unmount() {
    this.element?.remove();
    this.element = undefined;

    this.contentElement?.remove();
    this.contentElement = undefined;
  }

  public destroy() {
    this.unmount();
  }

  private addMessage(message: Message) {
    const messageElement = createMessageElement(message.color);
    this.getContentElementOrFail().appendChild(messageElement);

    messageElement.textContent = message.text;

    return messageElement;
  }

  private cloneForFitting(size: Size) {
    const originalElement = this.getContentElementOrFail();
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;
    const computedStyle = window.getComputedStyle(originalElement);
    for (const key of computedStyle) {
      clonedElement.style.setProperty(key, computedStyle.getPropertyValue(key));
    }

    clonedElement.style.visibility = "hidden";
    clonedElement.style.position = "absolute";
    document.body.appendChild(clonedElement);

    return clonedElement;
  }

  private createElement() {
    const page = document.createElement("div");

    this.updateClasses(page);

    page.style.transitionDuration = `${FLIPPING_ANIMATION_DURATION}ms`;

    return page;
  }

  private updateClasses(element: HTMLElement) {
    element.className = [
      PAGE_CLASSES(this.side),
      this.flipped
        ? tw`flipped ${this.side === "left" ? "rotate-y-180" : "-rotate-y-180"}`
        : "",
      this.hidden ? tw`hidden` : "",
      this.inFront ? tw`z-1` : "",
    ].join(" ");
  }

  public setFlipped(flipped: boolean) {
    this.flipped = flipped;
    if (!this.element) {
      return;
    }

    console.log("flipped", flipped);
    this.updateClasses(this.element);
  }

  private createContentElement() {
    const pageContent = document.createElement("div");
    pageContent.classList.add(...PAGE_CONTENT_CLASSES.split(" "));
    return pageContent;
  }
}
