import React from "react";

import { UniqueEntityID } from "@/shared/domain";
import { useAssetShared } from "@/shared/hooks/use-asset-shared";
import { useCard } from "@/shared/hooks/use-card";
import { cn } from "@/shared/lib";
import {
  Avatar,
  SubscribeBadge,
} from "@/shared/ui";
import { CharacterCard } from "@/entities/card/domain";

/** Visual state configuration for the button */
interface ButtonStateProps {
  isUser?: boolean;
  isHighLighted?: boolean;
  isSubscribeBadge?: boolean;
  isDisabled?: boolean;
}

/** Display configuration for the button */
interface ButtonDisplayProps {
  showName?: boolean;
  shape?: "circle" | "hexagon";
}

export interface UserInputCharacterButtonProps extends ButtonStateProps, ButtonDisplayProps {
  characterCardId?: UniqueEntityID;
  icon?: React.ReactNode;
  iconSrc?: string;
  label?: string | React.ReactNode;
  onClick?: () => void;
}

export const UserInputCharacterButton = React.memo(({
  characterCardId,
  icon,
  iconSrc,
  label,
  onClick = () => {},
  // State props
  isUser = false,
  isHighLighted = false,
  isSubscribeBadge = false,
  isDisabled = false,
  // Display props
  showName = true,
  shape = "circle",
}: UserInputCharacterButtonProps) => {
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [characterIcon, characterIconIsVideo] = useAssetShared(
    characterCard?.props.iconAssetId,
  );

  if (characterCardId && !characterCard) {
    return null;
  }

  const isHexagon = shape === "hexagon";

  // Use custom iconSrc if provided, otherwise use card's icon
  const avatarSrc = iconSrc || characterIcon;
  const avatarIsVideo = iconSrc ? false : characterIconIsVideo;

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-[4px]",
        isDisabled ? "pointer-events-none cursor-default opacity-50" : "cursor-pointer",
      )}
      onClick={onClick}
    >
      {isSubscribeBadge && <SubscribeBadge />}
      {characterCard ? (
        <>
          {/* Mobile avatar (36px) */}
          <Avatar
            src={avatarSrc}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={36}
            isVideo={avatarIsVideo}
            isDisabled={isDisabled}
            shape={shape}
            className={cn(
              "md:hidden",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
          />
          {/* Desktop avatar (48px) */}
          <Avatar
            src={avatarSrc}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={48}
            isVideo={avatarIsVideo}
            isDisabled={isDisabled}
            shape={shape}
            className={cn(
              "hidden md:flex",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
          />
          <div
            className={cn(
              "text-text-primary text-[10px] leading-[12px] font-[500] md:text-[12px] md:leading-[15px]",
              showName && "max-w-[36px] truncate md:max-w-[48px]",
            )}
          >
            {showName
              ? (characterCard.props.name ?? characterCard.props.title)
              : (label ?? "Scenario")}
          </div>
          {/* Hover overlay - different style for hexagon vs circle */}
          {!isHexagon && (
            <>
              {/* Mobile overlay (36px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 size-[36px] md:hidden",
                  "border-border-selected-inverse rounded-full border-[3px]",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
              />
              {/* Desktop overlay (48px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 hidden size-[48px] md:block",
                  "border-border-selected-inverse rounded-full border-[3px]",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
              />
            </>
          )}
          {isHexagon && (
            <>
              {/* Mobile hexagon overlay (36px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 size-[36px] md:hidden",
                  "bg-white/10",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
                style={{
                  clipPath:
                    "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                }}
              />
              {/* Desktop hexagon overlay (48px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 hidden size-[48px] md:block",
                  "bg-white/10",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
                style={{
                  clipPath:
                    "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                }}
              />
            </>
          )}
          {isUser && (
            <div className="bg-status-optional absolute top-0 right-0 size-[12px] rounded-full border-[2px]" />
          )}
        </>
      ) : (
        <>
          {/* Mobile icon (36px) */}
          <div
            className={cn(
              "text-text-primary grid size-[36px] place-items-center md:hidden",
              isHexagon ? "" : "rounded-full",
              "bg-background-surface-4 group-hover:bg-background-surface-5 border-border-normal border transition-colors duration-300 ease-out",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
            style={
              isHexagon
                ? {
                    clipPath:
                      "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                  }
                : undefined
            }
          >
            {icon}
          </div>
          {/* Desktop icon (48px) */}
          <div
            className={cn(
              "text-text-primary hidden size-[48px] place-items-center md:grid",
              isHexagon ? "" : "rounded-full",
              "bg-background-surface-4 group-hover:bg-background-surface-5 border-border-normal border transition-colors duration-300 ease-out",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
            style={
              isHexagon
                ? {
                    clipPath:
                      "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                  }
                : undefined
            }
          >
            {icon}
          </div>
          <div
            className={cn(
              "text-text-primary text-[10px] leading-[12px] font-[500] md:text-[12px] md:leading-[15px]",
              showName && "max-w-[36px] truncate md:max-w-[48px]",
            )}
          >
            {showName ? label : (label ?? "Scenario")}
          </div>
        </>
      )}
    </div>
  );
});
