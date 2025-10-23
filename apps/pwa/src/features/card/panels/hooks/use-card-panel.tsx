import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/modules/card/domain";
import { UniqueEntityID } from "@/shared/domain";
import { cardQueries } from "@/app/queries/card-queries";
import { debounce } from "lodash-es";
import { SvgIcon } from "@/shared/ui";

interface UseCardPanelOptions {
  cardId: string;
}

interface UseCardPanelReturn<T extends Card> {
  card: T | undefined;
  isLoading: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
  lastInitializedCardId: React.MutableRefObject<string | null>;
  createDebouncedSave: <P extends any[]>(
    saveFunction: (card: T, ...args: P) => void,
    delay?: number,
  ) => (...args: P) => void;
}

/**
 * Custom hook for card panel functionality
 * Handles loading, saving, and debouncing for card panels
 */
export function useCardPanel<T extends Card = Card>({
  cardId,
}: UseCardPanelOptions): UseCardPanelReturn<T> {
  // React Query and core hooks
  const queryClient = useQueryClient();
  const { data: card, isLoading } = useQuery(
    cardQueries.detail<Card>(cardId ? new UniqueEntityID(cardId) : undefined),
  );

  // Refs
  const lastInitializedCardId = useRef<string | null>(null);

  // Type cast the card - panels should handle type checking
  const typedCard = card as T | undefined;

  // Factory for creating debounced save functions
  const createDebouncedSave = useCallback(
    <P extends any[]>(
      saveFunction: (card: T, ...args: P) => void,
      delay = 300,
    ) => {
      return debounce((...args: P) => {
        if (!typedCard) return;
        saveFunction(typedCard, ...args);
      }, delay);
    },
    [typedCard],
  );

  return {
    card: typedCard,
    isLoading,
    queryClient,
    lastInitializedCardId,
    createDebouncedSave,
  };
}

/**
 * Base props for all card panels
 */
export interface CardPanelProps {
  cardId: string;
}

/**
 * Common loading state component
 */
export function CardPanelLoading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="bg-background-surface-2 flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-spin-slow">
          <SvgIcon name="astrsk_symbol" size={48} />
        </div>
        <div className="text-text-subtle text-sm">{message}</div>
      </div>
    </div>
  );
}

/**
 * Common error state component
 */
export function CardPanelError({
  message = "Card not found",
}: {
  message?: string;
}) {
  return (
    <div className="text-text-subtle bg-background-surface-2 h-full w-full p-4">
      {message}
    </div>
  );
}

/**
 * Common empty state component
 */
export function CardPanelEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center justify-start gap-2">
          <div className="text-text-body justify-start text-center text-base leading-relaxed font-semibold">
            {title}
          </div>
          {description && (
            <div className="text-background-surface-5 w-44 justify-start text-center text-xs font-normal">
              {description}
            </div>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
