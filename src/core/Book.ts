import { tw } from "@/utils/tw";
import { typeWriter } from "@/utils/type-writer";
import { wait } from "@/utils/wait";

const FLIPPING_ANIMATION_DURATION = 1000;

type MessageProps = { color?: "white" | "gray" };

export class Book {
  leftPage!: HTMLElement;
  rightPage!: HTMLElement;
  leftContent!: HTMLElement;
  rightContent!: HTMLElement;

  currentContent!: HTMLElement;

  previousMessageColor: "white" | "gray" = "gray";

  constructor(private book: HTMLElement) {
    this.prepareBookElement();

    this.createPages();
  }

  private createPages() {
    this.leftPage = createPageElement("left");
    this.leftContent = this.leftPage.querySelector(".page-content")!;
    this.book.appendChild(this.leftPage);

    this.rightPage = createPageElement("right");
    this.rightContent = this.rightPage.querySelector(".page-content")!;
    this.book.appendChild(this.rightPage);

    this.currentContent = this.leftContent;
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
  public async tryFittingMessage(pageContent: HTMLElement, words: string[]) {
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
      this.currentContent,
      message.split(" "),
    );
    if (!text) {
      await this.nextPage();
      await this.writeMessage(message, usedMessageProps);
      return;
    }

    const messageElement = createMessageElement(usedMessageProps);
    this.currentContent.appendChild(messageElement);

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
    if (this.currentContent === this.rightContent) {
      // If we reach the end of the right page, and still have stuff to write
      if (isContinuingWriting) {
        await wait(2000);
      }

      await this.flipPage();
      this.currentContent = this.leftContent;
      return;
    }

    this.currentContent = this.rightContent;
  }

  public async flipPage() {
    const oldLeftPage = this.leftPage;
    const oldRightPage = this.rightPage;

    this.createPages();

    // flip previous right page to the left
    oldRightPage.classList.add(tw`-rotate-y-180`);
    // force the new leftPage to be flipped OVER the current right page
    this.leftPage.classList.add(tw`rotate-y-180`);

    // wait for the browser to properly render the flipped pages
    await nextRepaint();

    // then force the left page to animate to its expected position
    this.leftPage.classList.remove(tw`rotate-y-180`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // hide the old pages (we could remove them from the dom too)
        oldLeftPage.classList.add("hidden");
        oldRightPage.classList.add("hidden");

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

function createPageElement(side: "left" | "right") {
  const page = document.createElement("div");
  const classes = tw`absolute right-0 flex h-full w-1/2 flex-col border bg-white shadow transition-transform backface-hidden transform-3d even:border-l-0`;
  const sideClasses = {
    left: tw`left-0 origin-right rounded-lg rounded-r-none`,
    right: tw`right-0 origin-left rounded-lg rounded-l-none`,
  };
  page.classList.add(...classes.split(" "), ...sideClasses[side].split(" "));
  page.style.transitionDuration = `${FLIPPING_ANIMATION_DURATION}ms`;

  const pageContent = createPageContentElement();

  page.appendChild(pageContent);
  return page;
}

function createPageContentElement() {
  const pageContent = document.createElement("div");
  pageContent.classList.add(
    ...tw`page-content grow overflow-auto rounded-lg bg-white p-1`.split(" "),
  );
  return pageContent;
}
