const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

// Game shortcuts must never fire while someone is typing a nickname
export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || TYPING_TAGS.has(target.tagName));