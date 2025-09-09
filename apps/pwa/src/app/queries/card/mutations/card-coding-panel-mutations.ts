import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardKeys } from "../query-factory";
import { CardService } from "@/app/services/card-service";
import { UniqueEntityID } from "@/shared/domain";

// Hook for updating card coding panel state with optimistic updates
export function useUpdateCardCodingPanelState(cardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (isOpen: boolean) => {
      const result = await CardService.updateCardCodingPanelState.execute({ 
        cardId: new UniqueEntityID(cardId), 
        isCodingPanelOpen: isOpen 
      });
      if (result.isFailure) throw new Error(result.getError());
      return isOpen;
    },
    onMutate: async (isOpen: boolean) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      
      // Snapshot the previous value
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      
      // Optimistically update the card detail
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          props: {
            ...old.props,
            isCodingPanelOpen: isOpen,
            updatedAt: new Date()
          }
        };
      });
      
      // Return context for potential rollback
      return { previousCard };
    },
    onError: (err, isOpen, context) => {
      // Restore previous value on error
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      console.error('Failed to update card coding panel state:', err);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ 
        queryKey: cardKeys.detail(cardId)
      });
    },
  });
}