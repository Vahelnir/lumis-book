# Lumi's Book

A fun experiment where I'm trying re-implement [Lumi_pomme](https://www.twitch.tv/lumi_pomme)'s book.

It's a book, displayed in their stream, that allows them to communicate with the chat since they're not using a microphone.

Demo available [here](https://vahelnir.github.io/lumis-book/)

### Original goals:

- [x] writing text must use a type-writer like animation;
- [x] writing a long message must be properly be split into multiple pages;
- [x] changing page after writing a message must be animated, like a book;
- [x] must be able to infinitly write into the book;
- [x] must be able to open and close the book (animated)

### New goals:

- [ ] Implement a dashboard that allow someone to type messages and basically control the book.
- [ ] The book needs to fade out after a certain amount of time as elapsed after the last message written (start counting at the end of the writing animation).
- [ ] The book needs to fade in when the message starts writing

### Bonuses:

- [x] messages are stored
- [x] we can paginate between pages
- [x] changing (with the pagination) page must be animated
- [x] we can (lightly) theme the book
- [ ] book is a custom element
- [x] book is a vue component

### Technical TODOs:

- [x] use slots to customize parts of the book (Only for the Vue based component, not the binding one)
- [ ] try to refactor this by using state machines or something.
- [ ] try to refactor this only using Vue (might be easier with state machines)
- [ ] manage busy states directly inside of the core system
- [ ] try using animations instead of transitions (and also use the transitionend/transitionstart or animationend/animationstart events)
