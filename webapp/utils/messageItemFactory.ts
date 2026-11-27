// ui/messageItemFactory.ts
import MessageItem from "sap/m/MessageItem";

export function createMessageItemTemplate(): MessageItem {
  return new MessageItem({
    type: "{type}",
    title: "{title}",
    description: "{description}",
    subtitle: "{subtitle}",
    counter: "{counter}",
    markupDescription: "{markupDescription}",
  });
}
