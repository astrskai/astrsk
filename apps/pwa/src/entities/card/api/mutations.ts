/**
 * Card Mutation Hooks
 *
 * Ready-to-use mutation hooks for card operations.
 * These combine optimistic updates, API calls, and invalidation.
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardService } from "@/app/services/card-service";
import { cardKeys } from "./query-factory";
import { UniqueEntityID } from "@/shared/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";

/**
 * Hook for updating card title with edit mode support
 */
export const useUpdateCardTitle = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (title: string) => {
      const result = await CardService.updateCardTitle.execute({
        cardId,
        title,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return title;
    },

    onMutate: async (title) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.lists() });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousLists = queryClient.getQueriesData({
        queryKey: cardKeys.lists(),
      });

      // Optimistic update - detail (in persistence format)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            title: title,
            updated_at: new Date(),
          },
        };
      });

      // Optimistic update - all list queries (in persistence format)
      queryClient.setQueriesData(
        { queryKey: cardKeys.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Find and update the specific card in the list
          // Must update in persistence format: common.title (ID is in common.id)
          return oldData.map((card) =>
            card.common?.id === cardId || card.common?.id?.toString() === cardId
              ? {
                  ...card,
                  common: {
                    ...card.common,
                    title: title,
                    updated_at: new Date(),
                  },
                }
              : card,
          );
        },
      );

      return { previousCard, previousLists };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();

        // If no list queries were in cache during optimistic update,
        // invalidate them so they refetch fresh data when user navigates back
        const currentLists = queryClient.getQueriesData({
          queryKey: cardKeys.lists(),
        });

        if (currentLists.length === 0) {
          await queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
        }
      }

      // Optimistic updates handle UI refresh when list queries are in cache
      // Invalidation ensures fresh data when list queries are not cached
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card summary/description with edit mode support
 */
export const useUpdateCardSummary = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (cardSummary: string) => {
      const result = await CardService.updateCardSummary.execute({
        cardId,
        cardSummary: cardSummary,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return cardSummary;
    },

    onMutate: async (cardSummary) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic updates - metadata
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            card_summary: cardSummary,
            updated_at: new Date(),
          },
        };
      });
      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating character card name (for character cards specifically)
 */
export const useUpdateCharacterName = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await CardService.updateCharacterName.execute({
        cardId,
        name,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return name;
    },

    onMutate: async (name) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.lists() });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousLists = queryClient.getQueriesData({
        queryKey: cardKeys.lists(),
      });

      // Optimistic update - detail (in persistence format)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old || !old.character) return old;
        return {
          ...old,
          character: {
            ...old.character,
            name: name,
          },
          common: {
            ...old.common,
            updated_at: new Date(),
          },
        };
      });

      // Optimistic update - all list queries (in persistence format)
      queryClient.setQueriesData(
        { queryKey: cardKeys.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Find and update the specific card in the list
          // Must update in persistence format: character.name (ID is in common.id)
          return oldData.map((card) =>
            card.common?.id === cardId || card.common?.id?.toString() === cardId
              ? {
                  ...card,
                  character: card.character
                    ? {
                        ...card.character,
                        name: name,
                      }
                    : undefined,
                  common: {
                    ...card.common,
                    updated_at: new Date(),
                  },
                }
              : card,
          );
        },
      );

      return { previousCard, previousLists };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();

        // If no list queries were in cache during optimistic update,
        // invalidate them so they refetch fresh data when user navigates back
        const currentLists = queryClient.getQueriesData({
          queryKey: cardKeys.lists(),
        });

        if (currentLists.length === 0) {
          await queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
        }
      }

      // Optimistic updates handle UI refresh when list queries are in cache
      // Invalidation ensures fresh data when list queries are not cached
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating character card description
 */
export const useUpdateCharacterDescription = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (description: string) => {
      const result = await CardService.updateCharacterDescription.execute({
        cardId,
        description,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return description;
    },

    onMutate: async (description) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old || !old.character) return old;
        return {
          ...old,
          character: {
            ...old.character,
            description: description,
          },
          common: {
            ...old.common,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating character card example dialogue
 */
export const useUpdateCharacterExampleDialogue = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (exampleDialogue: string) => {
      const result = await CardService.updateCharacterExampleDialogue.execute({
        cardId,
        exampleDialogue,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return exampleDialogue;
    },

    onMutate: async (exampleDialogue) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old || !old.character) return old;
        return {
          ...old,
          character: {
            ...old.character,
            example_dialogue: exampleDialogue,
          },
          common: {
            ...old.common,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card tags
 */
export const useUpdateCardTags = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (tags: string[]) => {
      const result = await CardService.updateCardTags.execute({
        cardId,
        tags,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return tags;
    },

    onMutate: async (tags) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            tags: tags,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card version
 */
export const useUpdateCardVersion = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (version: string) => {
      const result = await CardService.updateCardVersion.execute({
        cardId,
        version,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return version;
    },

    onMutate: async (version) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            version: version,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card conceptual origin
 */
export const useUpdateCardConceptualOrigin = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (conceptualOrigin: string) => {
      const result = await CardService.updateCardConceptualOrigin.execute({
        cardId,
        conceptualOrigin,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return conceptualOrigin;
    },

    onMutate: async (conceptualOrigin) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            conceptual_origin: conceptualOrigin,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card creator
 */
export const useUpdateCardCreator = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (creator: string) => {
      const result = await CardService.updateCardCreator.execute({
        cardId,
        creator,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return creator;
    },

    onMutate: async (creator) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            creator: creator,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card lorebook entries
 */
export const useUpdateCardLorebook = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (lorebook: any) => {
      const result = await CardService.updateCardLorebook.execute({
        cardId,
        lorebook,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return lorebook;
    },

    onMutate: async (lorebook) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.lorebook(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousLorebook = queryClient.getQueryData(
        cardKeys.lorebook(cardId),
      );

      // Optimistic update for lorebook queries
      if (lorebook) {
        queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
          if (!old) return old;
          // Lorebook can be in either character or plot
          if (old.character) {
            return {
              ...old,
              character: {
                ...old.character,
                lorebook: lorebook,
              },
              common: {
                ...old.common,
                updated_at: new Date(),
              },
            };
          } else if (old.plot) {
            return {
              ...old,
              plot: {
                ...old.plot,
                lorebook: lorebook,
              },
              common: {
                ...old.common,
                updated_at: new Date(),
              },
            };
          }
          return old;
        });
        queryClient.setQueryData(cardKeys.lorebook(cardId), lorebook);
      } else {
        queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
          if (!old) return old;
          // Clear lorebook from either character or plot
          if (old.character) {
            return {
              ...old,
              character: {
                ...old.character,
                lorebook: null,
              },
              common: {
                ...old.common,
                updated_at: new Date(),
              },
            };
          } else if (old.plot) {
            return {
              ...old,
              plot: {
                ...old.plot,
                lorebook: null,
              },
              common: {
                ...old.common,
                updated_at: new Date(),
              },
            };
          }
          return old;
        });
        queryClient.setQueryData(cardKeys.lorebook(cardId), null);
      }

      return { previousCard, previousLorebook };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousLorebook) {
        queryClient.setQueryData(
          cardKeys.lorebook(cardId),
          context.previousLorebook,
        );
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.lorebook(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card scenarios
 */
export const useUpdateCardScenarios = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (scenarios: any[]) => {
      const result = await CardService.updateCardScenarios.execute({
        cardId,
        scenarios,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return scenarios;
    },

    onMutate: async (scenarios) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.scenarios(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousScenarios = queryClient.getQueryData(
        cardKeys.scenarios(cardId),
      );

      // Optimistic update for scenarios queries
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          plot: {
            ...old.plot,
            scenarios: scenarios,
          },
          common: {
            ...old.common,
            updated_at: new Date(),
          },
        };
      });
      queryClient.setQueryData(cardKeys.scenarios(cardId), scenarios || []);

      return { previousCard, previousScenarios };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousScenarios) {
        queryClient.setQueryData(
          cardKeys.scenarios(cardId),
          context.previousScenarios,
        );
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.scenarios(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating plot card description with edit mode support
 */
export const useUpdatePlotDescription = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (description: string) => {
      const result = await CardService.updatePlotDescription.execute({
        cardId,
        description,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return description;
    },

    onMutate: async (description) => {
      startEditing();

      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old || !old.plot) return old;
        return {
          ...old,
          plot: {
            ...old.plot,
            description: description,
          },
          common: {
            ...old.common,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for deleting a card
 */
export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const result = await CardService.deleteCard.execute(
        new UniqueEntityID(cardId),
      );
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return cardId;
    },

    onSuccess: (cardId) => {
      // Remove from all caches
      queryClient.removeQueries({ queryKey: cardKeys.detail(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.lorebook(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.scenarios(cardId) });

      // Invalidate list queries to remove from lists
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
};

/**
 * Hook for cloning a card
 */
export const useCloneCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const result = await CardService.cloneCard.execute({
        cardId: new UniqueEntityID(cardId),
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return result.getValue();
    },

    onSuccess: () => {
      // Invalidate list queries to show the new cloned card
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
};

/**
 * Hook for updating card icon asset
 */
export const useUpdateCardIconAsset = (cardId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (iconAssetId: string | null) => {
      const result = await CardService.updateCardIconAsset.execute({
        cardId,
        iconAssetId,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return iconAssetId;
    },

    onMutate: async (iconAssetId) => {
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update - metadata
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            icon_asset_id: iconAssetId,
            updated_at: new Date(),
          },
        };
      });

      return { previousCard };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: cardKeys.detail(cardId),
      });
      await queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating entire character card (batch update)
 */
export const useUpdateCharacterCard = (cardId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      name?: string;
      description?: string;
      exampleDialogue?: string;
      tags?: string[];
      creator?: string;
      cardSummary?: string;
      version?: string;
      conceptualOrigin?: string;
      imagePrompt?: string;
      iconAssetId?: string;
      lorebookEntries?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        keys: string[];
        recallRange: number;
        content: string;
      }>;
    }) => {
      // Update each field that has changed
      const promises: Promise<unknown>[] = [];

      if (data.title !== undefined) {
        promises.push(
          CardService.updateCardTitle.execute({ cardId, title: data.title }),
        );
      }
      if (data.name !== undefined) {
        promises.push(
          CardService.updateCharacterName.execute({ cardId, name: data.name }),
        );
      }
      if (data.description !== undefined) {
        promises.push(
          CardService.updateCharacterDescription.execute({
            cardId,
            description: data.description,
          }),
        );
      }
      if (data.exampleDialogue !== undefined) {
        promises.push(
          CardService.updateCharacterExampleDialogue.execute({
            cardId,
            exampleDialogue: data.exampleDialogue,
          }),
        );
      }
      if (data.tags !== undefined) {
        promises.push(
          CardService.updateCardTags.execute({ cardId, tags: data.tags }),
        );
      }
      if (data.creator !== undefined) {
        promises.push(
          CardService.updateCardCreator.execute({
            cardId,
            creator: data.creator,
          }),
        );
      }
      if (data.cardSummary !== undefined) {
        promises.push(
          CardService.updateCardSummary.execute({
            cardId,
            cardSummary: data.cardSummary,
          }),
        );
      }
      if (data.version !== undefined) {
        promises.push(
          CardService.updateCardVersion.execute({
            cardId,
            version: data.version,
          }),
        );
      }
      if (data.conceptualOrigin !== undefined) {
        promises.push(
          CardService.updateCardConceptualOrigin.execute({
            cardId,
            conceptualOrigin: data.conceptualOrigin,
          }),
        );
      }
      if (data.imagePrompt !== undefined) {
        promises.push(
          CardService.updateCardImagePrompt.execute({
            cardId,
            imagePrompt: data.imagePrompt,
          }),
        );
      }
      if (data.iconAssetId !== undefined) {
        promises.push(
          CardService.updateCardIconAsset.execute({
            cardId,
            iconAssetId: data.iconAssetId || null,
          }),
        );
      }
      if (data.lorebookEntries !== undefined) {
        // Convert form data to lorebook format
        const lorebookJSON = {
          entries: data.lorebookEntries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            enabled: entry.enabled,
            keys: entry.keys,
            recallRange: entry.recallRange,
            content: entry.content,
          })),
        };
        const lorebookResult = Lorebook.fromJSON(lorebookJSON);
        if (lorebookResult.isSuccess) {
          promises.push(
            CardService.updateCardLorebook.execute({
              cardId,
              lorebook: lorebookResult.getValue(),
            }),
          );
        }
      }

      const results = await Promise.all(promises);

      // Check if any operation failed
      const failures = results.filter((r): r is {
        isFailure: boolean;
        getError: () => string;
      } => {
        if (r === null || typeof r !== "object") return false;
        if (!("isFailure" in r)) return false;
        const result = r as { isFailure: unknown };
        return result.isFailure === true;
      });

      if (failures.length > 0) {
        throw new Error(
          `Failed to update card: ${failures.map((f) => f.getError()).join(", ")}`,
        );
      }

      return data;
    },

    onSuccess: () => {
      // Invalidate all related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cardKeys.lorebook(cardId) });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook for updating card image prompt
 */
export const useUpdateCardImagePrompt = (cardId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (imagePrompt: string) => {
      const result = await CardService.updateCardImagePrompt.execute({
        cardId,
        imagePrompt,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return imagePrompt;
    },

    onMutate: async (imagePrompt) => {
      startEditing();
      await queryClient.cancelQueries({
        queryKey: cardKeys.imagePrompt(cardId),
      });
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });

      const previousPrompt = queryClient.getQueryData(
        cardKeys.imagePrompt(cardId),
      );
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));

      // Optimistic update
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          common: {
            ...old.common,
            image_prompt: imagePrompt,
            updated_at: new Date(),
          },
        };
      });
      queryClient.setQueryData(cardKeys.imagePrompt(cardId), imagePrompt);

      return { previousCard, previousPrompt };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousPrompt !== undefined) {
        queryClient.setQueryData(
          cardKeys.imagePrompt(cardId),
          context.previousPrompt,
        );
      }
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (_data, error) => {
      if (!error) {
        endEditing();
      }

      // Always invalidate - the query itself is disabled during editing/cursor
      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.imagePrompt(cardId),
      // });
      // await queryClient.invalidateQueries({
      //   queryKey: cardKeys.detail(cardId),
      // });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
