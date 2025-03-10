import { tw } from "@/utils/tw";
import { typeWriter } from "@/utils/type-writer";
import { wait } from "@/utils/wait";

const FLIPPING_ANIMATION_DURATION = 1000;

type MessageProps = { color?: "white" | "gray" };

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

  const pageContent = document.createElement("div");
  pageContent.classList.add(
    ...tw`page-content grow overflow-auto p-1`.split(" "),
  );

  page.appendChild(pageContent);
  return page;
}

export class Book {
  leftPage!: HTMLElement;
  rightPage!: HTMLElement;
  leftContent!: HTMLElement;
  rightContent!: HTMLElement;

  currentContent!: HTMLElement;

  previousMessageColor: "white" | "gray" = "gray";

  constructor(private book: HTMLElement) {
    this.resetBookContent();
    this.book.className = tw`relative flex h-60 w-80 rounded-lg bg-white perspective-distant transform-3d`;

    this.createPages();

    this.initialize();
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

  private resetBookContent() {
    for (const child of this.book.children) {
      this.book.removeChild(child);
    }
  }

  public async tryFitMessage(
    messageElement: HTMLElement,
    pageContent: HTMLElement,
    words: string[],
  ) {
    messageElement.textContent = words[0] + " ";
    if (pageContent.scrollHeight > pageContent.clientHeight) {
      return { text: undefined, overflowingText: words.join(" ") };
    }

    for (let index = 1; index < words.length; index++) {
      const word = words[index];
      messageElement.textContent += word + " ";

      if (pageContent.scrollHeight <= pageContent.clientHeight) {
        continue;
      }

      return {
        text: messageElement.textContent?.slice(0, -(word.length + 1)),
        overflowingText: "... " + words.slice(index).join(" "),
      };
    }

    return { text: messageElement.textContent, overflowingText: undefined };
  }

  public async addMessage(
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
    const messageElement = createMessageElement(usedMessageProps);
    this.currentContent.appendChild(messageElement);

    const { text, overflowingText } = await this.tryFitMessage(
      messageElement,
      this.currentContent,
      message.split(" "),
    );
    if (!text) {
      this.currentContent.removeChild(messageElement);
      await this.nextPage();
      await this.addMessage(message, usedMessageProps);
      return;
    }

    messageElement.textContent = "";
    await typeWriter(text, (letter) => {
      messageElement.textContent += letter;
    });

    if (overflowingText) {
      await this.nextPage(true);
      await this.addMessage(overflowingText, usedMessageProps);
      return;
    }
  }

  public async nextPage(isContinuingWriting = false) {
    if (this.currentContent === this.rightContent) {
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
    console.log("flipping page");
    const oldLeftPage = this.leftPage;
    const oldRightPage = this.rightPage;
    this.createPages();
    oldRightPage.classList.add(tw`-rotate-y-180`);
    this.leftPage.classList.add(tw`rotate-y-180`);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.leftPage.classList.remove(tw`rotate-y-180`);
      });
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // remove the flipped class and add hidden class
        oldLeftPage.classList.add("hidden");
        oldRightPage.classList.add("hidden");
        resolve();
      }, FLIPPING_ANIMATION_DURATION); // Match the CSS transition time
    });
  }

  private initialize() {}

  // function addText(text) {
  //   const words = text.split(" ");
  //   for (const word of words) {
  //     currentPage.innerHTML += word + " ";
  //     if (currentPage.scrollHeight > currentPage.clientHeight) {
  //       const overflowText = currentPage.innerHTML.slice(
  //         currentPage.innerHTML.lastIndexOf(word),
  //       );
  //       currentPage.innerHTML = currentPage.innerHTML.slice(
  //         0,
  //         currentPage.innerHTML.lastIndexOf(word),
  //       );
  //       flipPage(overflowText);
  //       return;
  //     }
  //   }
  // }

  // function createNewPages(overflowText) {
  //   const newLeftPage = document.createElement("div");
  //   newLeftPage.classList.add("page", "page-left");
  //   const newLeftContent = document.createElement("div");
  //   newLeftContent.classList.add("page-content");
  //   newLeftPage.appendChild(newLeftContent);

  //   const newRightPage = document.createElement("div");
  //   newRightPage.classList.add("page", "page-right");
  //   const newRightContent = document.createElement("div");
  //   newRightContent.classList.add("page-content");
  //   newRightPage.appendChild(newRightContent);

  //   book.appendChild(newLeftPage);
  //   book.appendChild(newRightPage);

  //   leftPage.remove();
  //   rightPage.remove();

  //   leftPage = newLeftPage;
  //   rightPage = newRightPage;
  //   leftContent = newLeftContent;
  //   rightContent = newRightContent;

  //   if (currentPage === leftContent) {
  //     currentPage = rightContent;
  //   } else {
  //     currentPage = leftContent;
  //   }

  //   addText(overflowText);
  // }

  destroy() {}
}
