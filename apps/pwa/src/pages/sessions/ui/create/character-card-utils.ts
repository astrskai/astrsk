/**
 * Character Card Utilities
 *
 * Shared utilities for character cards in Cast Step.
 */
import { User, Cpu, Sparkles, Globe } from "lucide-react";
import { createElement } from "react";

export const PLACEHOLDER_IMAGE_URL = "/img/placeholder/character-placeholder.png";

/**
 * Build character card badges based on selection state and source type
 * Labels are hidden on mobile (icon only) and shown on sm+ screens
 */
export function buildCharacterBadges(
  isPlayer: boolean,
  isAI: boolean,
  isLocal: boolean,
  isLibrary: boolean = false,
) {
  // Mobile: icon only with compact padding (px-1.5), no gap (gap-0)
  // Desktop (sm+): icon + label with normal padding (px-2) and gap (sm:gap-1)
  const responsiveStyles = "px-1.5 sm:px-2 gap-0 sm:gap-1";
  const responsiveLabel = (text: string) =>
    createElement("span", { className: "hidden sm:inline" }, text);

  return [
    // Source badge (left position) - icon only on mobile, with label on sm+
    ...(isLocal
      ? [
          {
            label: responsiveLabel("SESSION"),
            variant: "default" as const,
            position: "left" as const,
            className: `border-amber-500/30 bg-amber-950/50 text-amber-300 ${responsiveStyles}`,
            icon: createElement(Sparkles, { size: 10 }),
          },
        ]
      : isLibrary
        ? [
            {
              label: responsiveLabel("LIBRARY"),
              variant: "default" as const,
              position: "left" as const,
              className: `border-blue-500/30 bg-blue-950/50 text-blue-300 ${responsiveStyles}`,
              icon: createElement(Globe, { size: 10 }),
            },
          ]
        : []),
    // Selection badge (right position)
    ...(isPlayer
      ? [
          {
            label: responsiveLabel("PLAYER"),
            variant: "default" as const,
            position: "right" as const,
            className: `border-emerald-500/30 bg-emerald-950/50 text-emerald-300 ${responsiveStyles}`,
            icon: createElement(User, { size: 10 }),
          },
        ]
      : isAI
        ? [
            {
              label: responsiveLabel("AI"),
              variant: "default" as const,
              position: "right" as const,
              className: `border-purple-500/30 bg-purple-950/50 text-purple-300 ${responsiveStyles}`,
              icon: createElement(Cpu, { size: 10 }),
            },
          ]
        : []),
  ];
}
