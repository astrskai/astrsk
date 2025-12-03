/**
 * Default predefined tags for cards (characters and scenarios)
 * These tags are shown as toggleable buttons in the tag selection UI
 */
export const TAG_DEFAULT: readonly string[] = [
  "Female",
  "Male",
  "Villain",
  "Fictional",
  "OC",
  "LGBTQA+",
  "Platonic",
  "Angst",
  "Dead Dove",
  "Fluff",
  "Historical",
  "Royalty",
] as const;

export type DefaultTag = (typeof TAG_DEFAULT)[number];
