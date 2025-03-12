import { tw } from "@/utils/tw";
import { FLIPPING_ANIMATION_DURATION } from "./Book";

const PAGE_CLASSES = tw`absolute right-0 flex h-full w-1/2 flex-col border bg-white shadow transition-transform backface-hidden transform-3d even:border-l-0`;
const PAGE_SIDE_CLASSES = {
  left: tw`left-0 origin-right rounded-lg rounded-r-none`,
  right: tw`right-0 origin-left rounded-lg rounded-l-none`,
};

const PAGE_CONTENT_CLASSES = tw`page-content grow overflow-auto rounded-lg bg-white p-1`;

export class Page {
  public element: HTMLElement;
  public contentElement: HTMLElement;

  constructor(public side: "left" | "right") {
    this.element = this.createElement();
    this.contentElement = this.createContentElement();

    this.element.appendChild(this.contentElement);
  }

  public appendChild(element: Element) {
    return this.contentElement.appendChild(element);
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
