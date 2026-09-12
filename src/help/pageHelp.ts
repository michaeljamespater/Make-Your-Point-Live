export type HelpPageKey =
  | "First Page"
  | "Make Your Point"
  | "Points"
  | "Point Detail"
  | "Point Editor"
  | "Point To Point"
  | "Private Chats"
  | "Voice Forum"
  | "Admin"
  | "App Map";

export const PAGE_HELP: Record<HelpPageKey, { title: string; how: string[]; steps: string[] }> = {
  "First Page": {
    title: "Front Page — how to use",
    how: ["Choose where to go. Nothing is posted from this screen."],
    steps: [
      "Tap Make Your Point to write and publish.",
      "Tap Point To Point to join a group room.",
      "Tap Private Chats to message one person.",
      "Tap Points to read what others published.",
      "Light / Dark only changes colours.",
      "Fuel (amber) supports the platform. Help (top right) explains this screen.",
      "Later, Back goes one step. Front Page brings you here."
    ]
  },
  "Make Your Point": {
    title: "Make Your Point — how to use",
    how: ["This page publishes a public point to the Points list."],
    steps: [
      "Type a short title.",
      "Type your point in the large box.",
      "Add a Moniker (your name on the post). Use the same one next time so Edit and Delete work.",
      "Optional: pick a category and an audience.",
      "Optional: tags, a web link, photo, video, audio or file (picture / film / music icons).",
      "Fuel on this page supports the author or the platform.",
      "Tap POINT MADE. The point appears on Points.",
      "Pencil edits that point. Bin deletes it — only you on this device, or Admin with Editor ON."
    ]
  },
  "Points": {
    title: "Points — how to use",
    how: ["This is the public feed. Read, filter, open, edit or delete your own."],
    steps: [
      "Scroll the cards. Each card is one published point.",
      "Pencil = edit. Bin = delete. Only the author on this device or Admin (Editor ON) can delete.",
      "Tap the card body (not the icons) to open the full point and replies.",
      "Search box finds words, titles or monikers.",
      "Side list: tap a category or audience to filter. All Points clears the filter.",
      "Grouped stacks cards by category. Latest / Most Reacted changes order.",
      "Back closes a filter or returns toward Front Page one step at a time."
    ]
  },
  "Point Detail": {
    title: "Open point and replies — how to use",
    how: ["You are inside one point. This is a sub-page of Points."],
    steps: [
      "Read the full text and any photos or videos.",
      "Type a reply at the bottom and post it.",
      "Each reply has Edit and Delete.",
      "Pencil / bin on the point itself change or remove that point (author or Admin).",
      "Chat-with-author opens Private Chats with their moniker.",
      "Link starts a new point connected to this one.",
      "Back returns to the Points list only — not Front Page."
    ]
  },
  "Point Editor": {
    title: "Edit point — how to use",
    how: ["Sub-page of Make Your Point / Points. You opened the pencil."],
    steps: [
      "Change title, text, category, audience, tags or files.",
      "Bin next to a file removes that file only.",
      "Save writes the changes back to Points.",
      "Cancel leaves the text as it was.",
      "Back also leaves the editor and returns to the list."
    ]
  },
  "Point To Point": {
    title: "Point To Point — how to use",
    how: ["Group rooms. Public conversation, not a private DM."],
    steps: [
      "Type your Moniker first so others know who is speaking.",
      "Tap New group. Name the room and (optional) a topic.",
      "Tap a room on the left to open it (sub-page: the thread).",
      "Type in the white box. Attach with photo / video / audio icons.",
      "Send. Edit or Delete on a message changes only that message.",
      "Back leaves the room, then leaves Point To Point, one step each time."
    ]
  },
  "Private Chats": {
    title: "Private Chats — how to use",
    how: ["One person at a time. Not shown on the public Points list."],
    steps: [
      "Tap New DM and type the other person’s moniker.",
      "Tap a name on the left to open that chat (sub-page: the thread).",
      "Type in the white box. Same photo / video / audio icons as Make Your Point.",
      "If you arrived from a point, that point text is already in the box — send or edit it.",
      "Edit and Delete sit on each message.",
      "Back returns to Points, not Front Page."
    ]
  },
  "Voice Forum": {
    title: "Voice forum filter — how to use",
    how: ["Sub-page of Points. You opened one audience (Makers, Creators, and so on)."],
    steps: [
      "You are only seeing points aimed at that audience.",
      "Use the cards the same way as Points: open, pencil, bin.",
      "All Points clears the audience filter.",
      "Back returns to the unfiltered Points list."
    ]
  },
  "Admin": {
    title: "Admin and Editor — how to use",
    how: ["Owner tools. Ordinary users do not need these."],
    steps: [
      "Admin opens payout and owner settings.",
      "Editor asks for the Owner PIN. Editor ON lets you edit or delete any point.",
      "Map (only when Editor ON) is the Dynamo graph of pages and buttons.",
      "Turn Editor OFF when you finish so the Map disappears for everyone else."
    ]
  },
  "App Map": {
    title: "App Map — how to use (Admin only)",
    how: ["Visual map of pages and buttons. Not shown to the public."],
    steps: [
      "Large dark boxes are pages. Light boxes are buttons.",
      "Orange lines show where a button goes.",
      "Click a box. Set KEEP, CUT, MOVE, RENAME, SIMPLIFY or ADD.",
      "Type a new name and notes.",
      "Copy JSON or Download JSON and send that file back for build changes."
    ]
  }
};

export function helpKeyFor(
  activePageName: string,
  opts: { selectedPoint?: boolean; editing?: boolean; editorMode?: boolean }
): HelpPageKey {
  if (opts.editing) return "Point Editor";
  if (opts.selectedPoint) return "Point Detail";
  if (activePageName === "First Page") return "First Page";
  if (activePageName === "Make Your Point") return "Make Your Point";
  if (activePageName === "Point To Point") return "Point To Point";
  if (activePageName === "Private Chats") return "Private Chats";
  if (activePageName === "App Map") return "App Map";
  if (["Makers", "Creators", "Innovators", "Traders", "Preservers"].includes(activePageName)) {
    return "Voice Forum";
  }
  return "Points";
}
