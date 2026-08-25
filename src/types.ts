export type ReactionType = "hearHear" | "respect" | "supported" | "thoughtProvoking";

export interface Point {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  targetAudience: string;
  authorMoniker: string;
  tags?: string[];
  webAddress?: string;
  media?: { url: string; type: "photo" | "video" | "audio"; name?: string }[];
  reactions: {
    hearHear: number;
    respect: number;
    supported: number;
    thoughtProvoking: number;
  };
  repliesCount?: number;
  sponsorshipsTotal?: number;
  sponsorshipsCount?: number;
  linkedFromPointId?: string;
  linkedFromPointTitle?: string;
  createdAt: string;
  order?: number;
}

export interface Reply {
  id: string;
  pointId: string;
  content: string;
  authorMoniker: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  name: string;
  type: "group" | "private";
  participants: string[];
  topic?: string;
  lastMessage?: string;
  lastMessageTime: string;
  createdAt: string;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderMoniker: string;
  content: string;
  media?: { url: string; type: "photo" | "video" | "audio"; name?: string }[];
  createdAt: string;
}

export interface CategoryInfo {
  name: string;
  count: number;
  repliesCount?: number;
  subcategories: { name: string; count: number; repliesCount?: number }[];
}

export interface AudienceVoice {
  id: string;
  label: string;
  desc: string;
}

const DEFAULT_VOICES: AudienceVoice[] = [
  { id: "all", label: "All Forums", desc: "Every voice across the platform" },
  { id: "SilentMajority", label: "Silent Majority", desc: "Everyday people rarely heard" },
  { id: "Makers", label: "Makers", desc: "Builders, crafters, hands-on creators" },
  { id: "Creators", label: "Creators", desc: "Artists, writers, innovators of culture" },
  { id: "Innovators", label: "Innovators", desc: "New ideas and breakthroughs" },
  { id: "Traders", label: "Traders", desc: "Commerce, markets, exchange" },
  { id: "Preservers", label: "Preservers", desc: "Heritage, tradition, continuity" },
  { id: "ForgottenMinority", label: "Forgotten Minority", desc: "Overlooked communities" },
  { id: "AbandonedAlone", label: "Abandoned Alone", desc: "Those left behind" },
  { id: "CancelledNoHope", label: "Cancelled / No Hope", desc: "De-platformed voices" },
  { id: "UnheardAngry", label: "Unheard Angry", desc: "Frustrated and ignored" },
  { id: "DestituteDeserted", label: "Destitute Deserted", desc: "Materially left behind" },
  { id: "Controversial", label: "Controversial", desc: "Hard truths and dissent" },
  { id: "Anti-Establishment", label: "Anti-Establishment", desc: "Challenging power structures" },
  { id: "PeopleOfTomorrow", label: "People of Tomorrow", desc: "Future-focused voices" }
];

export function getAudienceVoices(): AudienceVoice[] {
  try {
    const stored = localStorage.getItem("make_your_point_audience_voices");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_VOICES;
}

export function saveAudienceVoices(voices: AudienceVoice[]) {
  try {
    localStorage.setItem("make_your_point_audience_voices", JSON.stringify(voices));
  } catch {}
}
