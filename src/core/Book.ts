import { tw } from "@/utils/tw";

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
  const classes = tw`absolute right-0 flex h-full w-1/2 flex-col border bg-white shadow transition-transform duration-1000 transform-3d even:border-l-0`;
  const sideClasses = {
    left: tw`left-0 origin-right`,
    right: tw`right-0 origin-left`,
  };
  page.classList.add(...classes.split(" "), ...sideClasses[side].split(" "));

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
    this.book.className = tw`relative flex h-60 w-80 rounded-lg bg-white perspective-distant`;

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

  public async addMessage(text: string, receivedMessageProps?: MessageProps) {
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
    // if the page is already overflowing, then we need to write to the next page
    if (this.currentContent.scrollHeight > this.currentContent.clientHeight) {
      this.currentContent.removeChild(messageElement);
      await this.nextPage();
    }

    this.currentContent.appendChild(messageElement);
    const words = text.split(" ");
    for (let index = 0; index < words.length; index++) {
      const word = words[index];
      messageElement.innerHTML += word + " ";
      if (
        this.currentContent.scrollHeight <= this.currentContent.clientHeight
      ) {
        continue;
      }

      messageElement.innerHTML = messageElement.innerHTML.slice(
        0,
        -(word.length + 1),
      );

      const overflowText = words.slice(index).join(" ");
      await this.nextPage();
      console.log("overflowText", overflowText);
      // add the elipsis to the new page, and then the overflowed text
      this.addMessage("... " + overflowText, usedMessageProps);
      return;
    }
  }

  public async nextPage() {
    if (this.currentContent === this.rightContent) {
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
      }, 1000); // Match the CSS transition time
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
