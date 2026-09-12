export type HelpPageKey =
  | "First Page"
  | "Make Your Point"
  | "Points"
  | "Point Detail"
  | "Point To Point"
  | "Private Chats"
  | "App Map";

export const PAGE_HELP: Record<HelpPageKey, { title: string; body: string[] }> = {
  "First Page": {
    title: "Front Page",
    body: [
      "This is the start screen.",
      "Make Your Point — write and publish.",
      "Point To Point — group chat rooms.",
      "Private Chats — one-to-one messages.",
      "Points — read the public feed.",
      "Light / Dark changes theme. Admin and Editor are owner tools.",
      "Back on later screens returns one step. Front Page always returns here."
    ]
  },
  "Make Your Point": {
    title: "Make Your Point",
    body: [
      "Type your title and your point.",
      "Moniker is the name shown on the post. Use the same moniker later so Edit and Delete recognise you.",
      "Optional: category, audience, tags, web link, photo, video, audio or file.",
      "POINT MADE publishes to Points.",
      "Pencil edits. Bin deletes. Only you (this device / same moniker) or Admin with Editor ON can delete."
    ]
  },
  "Points": {
    title: "Points",
    body: [
      "This is the public list of published points.",
      "Each card has a pencil (Edit) and a bin (Delete) at the top.",
      "Click the card body to open the full point and replies.",
      "Use search and the side lists to filter by category or audience.",
      "Grouped / All Points / Latest change how the list is sorted.",
      "Delete only works for the author on this device or Admin (Editor ON)."
    ]
  },
  "Point Detail": {
    title: "Open point and replies",
    body: [
      "You are reading one point in full.",
      "Reply at the bottom. Each reply has Edit and Delete.",
      "Back closes this point and returns to Points — it does not jump to Front Page.",
      "Link / chat icons start a related point or a private message with that author."
    ]
  },
  "Point To Point": {
    title: "Point To Point",
    body: [
      "Group rooms. Set your moniker first.",
      "New group creates a room. Click a room to open it.",
      "Type in the white box. Use the photo / video / audio icons to attach.",
      "Edit and Delete sit on each message.",
      "Back leaves the room list and returns to Points."
    ]
  },
  "Private Chats": {
    title: "Private Chats",
    body: [
      "One-to-one messages. Light layout, same upload icons as Make Your Point.",
      "New DM starts a chat by moniker.",
      "If you opened this from a point, that point text is placed in the box.",
      "Videos here play as uploaded.",
      "Back returns to Points."
    ]
  },
  "App Map": {
    title: "App Map (Dynamo style)",
    body: [
      "Pages are large nodes. Buttons are smaller nodes wired to the page they open.",
      "Click a node to select it. Change Action, New name, or Notes.",
      "KEEP / CUT / MOVE / RENAME / ADD tells me what to build next.",
      "Copy JSON or Download JSON and send that file back in chat."
    ]
  }
};

export function helpKeyFor(activePageName: string, selectedPoint: boolean): HelpPageKey {
  if (selectedPoint) return "Point Detail";
  if (activePageName === "First Page") return "First Page";
  if (activePageName === "Make Your Point") return "Make Your Point";
  if (activePageName === "Point To Point") return "Point To Point";
  if (activePageName === "Private Chats") return "Private Chats";
  if (activePageName === "App Map") return "App Map";
  return "Points";
}
