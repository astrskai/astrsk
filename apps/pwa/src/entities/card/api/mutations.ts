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
import { TableName } from "@/db/schema/table-name";
import { useSessionStore } from "@/shared/stores/session-store";

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

      // Optimistic update - detail (flat schema: title is at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          title: title,
          updated_at: new Date(),
        };
      });

      // Optimistic update - all list queries (flat schema)
      queryClient.setQueriesData(
        { queryKey: cardKeys.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Find and update the specific card in the list
          // Flat schema: id and title are at root level
          return oldData.map((card) =>
            card.id === cardId || card.id?.toString() === cardId
              ? {
                  ...card,
                  title: title,
                  updated_at: new Date(),
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

      // Optimistic updates - metadata (flat schema: card_summary at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          card_summary: cardSummary,
          updated_at: new Date(),
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

      // Optimistic update - detail (flat schema: name at root level for characters)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        // Check if this is a character (has example_dialogue field)
        if (!('example_dialogue' in old)) return old;
        return {
          ...old,
          name: name,
          updated_at: new Date(),
        };
      });

      // Optimistic update - all list queries (flat schema)
      queryClient.setQueriesData(
        { queryKey: cardKeys.lists() },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Find and update the specific card in the list
          // Flat schema: id and name are at root level
          return oldData.map((card) =>
            card.id === cardId || card.id?.toString() === cardId
              ? {
                  ...card,
                  name: name,
                  updated_at: new Date(),
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

      // Optimistic update (flat schema: description at root level for characters)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        // Check if this is a character (has example_dialogue field)
        if (!('example_dialogue' in old)) return old;
        return {
          ...old,
          description: description,
          updated_at: new Date(),
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

      // Optimistic update (flat schema: example_dialogue at root level for characters)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        // Check if this is a character (has example_dialogue field)
        if (!('example_dialogue' in old)) return old;
        return {
          ...old,
          example_dialogue: exampleDialogue,
          updated_at: new Date(),
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

      // Optimistic update (flat schema: tags at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tags: tags,
          updated_at: new Date(),
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

      // Optimistic update (flat schema: version at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          version: version,
          updated_at: new Date(),
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

      // Optimistic update (flat schema: conceptual_origin at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          conceptual_origin: conceptualOrigin,
          updated_at: new Date(),
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

      // Optimistic update (flat schema: creator at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          creator: creator,
          updated_at: new Date(),
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

      // Optimistic update for lorebook queries (flat schema: lorebook at root level)
      if (lorebook) {
        queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            lorebook: lorebook,
            updated_at: new Date(),
          };
        });
        queryClient.setQueryData(cardKeys.lorebook(cardId), lorebook);
      } else {
        queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            lorebook: null,
            updated_at: new Date(),
          };
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
      await queryClient.cancelQueries({ queryKey: cardKeys.firstMessages(cardId) });

      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousScenarios = queryClient.getQueryData(
        cardKeys.firstMessages(cardId),
      );

      // Optimistic update for first messages queries (flat schema: first_messages at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        // Check if this is a scenario (has first_messages field)
        if (!('first_messages' in old)) return old;
        return {
          ...old,
          first_messages: scenarios,
          updated_at: new Date(),
        };
      });
      queryClient.setQueryData(cardKeys.firstMessages(cardId), scenarios || []);

      return { previousCard, previousScenarios };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousScenarios) {
        queryClient.setQueryData(
          cardKeys.firstMessages(cardId),
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

      // Optimistic update (flat schema: description at root level for scenarios)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        // Check if this is a scenario (has first_messages field)
        if (!('first_messages' in old)) return old;
        return {
          ...old,
          description: description,
          updated_at: new Date(),
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
      queryClient.removeQueries({ queryKey: cardKeys.firstMessages(cardId) });

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

      // Optimistic update - metadata (flat schema: icon_asset_id at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          icon_asset_id: iconAssetId,
          updated_at: new Date(),
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

      // Optimistic update (flat schema: image_prompt at root level)
      queryClient.setQueryData(cardKeys.detail(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          image_prompt: imagePrompt,
          updated_at: new Date(),
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

/**
 * Hook for importing a character from cloud storage by ID
 *
 * This hook imports a character and automatically creates a play session
 * following the same pattern as the character detail page's Chat button.
 *
 * Returns: { characterId, sessionId } for navigation purposes
 */
export const useImportCharacterFromCloud = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["card", "importCharacterFromCloud"],
    mutationFn: async ({
      characterId,
    }: {
      characterId: string;
    }) => {
      // Step 1: Import character from cloud (as global card, no sessionId)
      const result = await CardService.importCharacterFromCloud.execute({
        characterId,
        sessionId: undefined, // Import as global card
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      const importedCharacter = result.getValue();

      // Step 2: Create play session with imported character
      // (Same logic as character detail page's Chat button)
      const { Session } = await import("@/entities/session/domain");
      const { defaultChatStyles } = await import("@/entities/session/domain/chat-styles");
      const { AutoReply } = await import("@/shared/stores/session-store");
      const { SessionService } = await import("@/app/services/session-service");
      const { FlowService } = await import("@/app/services/flow-service");
      const { CardType, ScenarioCard } = await import("@/entities/card/domain");
      const { logger } = await import("@/shared/lib");

      const DEFAULT_FLOW_FILE = "Simple_complete.json";
      const sessionName = importedCharacter.props.name || "Chat Session";

      // Create empty session first (for foreign key constraints)
      const sessionOrError = Session.create({
        title: sessionName,
        flowId: undefined,
        allCards: [],
        userCharacterCardId: undefined,
        turnIds: [],
        autoReply: AutoReply.Random,
        chatStyles: defaultChatStyles,
        isPlaySession: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (sessionOrError.isFailure) {
        throw new Error(`Failed to create session: ${sessionOrError.getError()}`);
      }

      const session = sessionOrError.getValue();
      const sessionId = session.id;

      // Save empty session first
      const initialSaveResult = await SessionService.saveSession.execute({
        session,
      });

      if (initialSaveResult.isFailure) {
        throw new Error(`Failed to save session: ${initialSaveResult.getError()}`);
      }

      // Import default flow from Simple.json
      const response = await fetch(`/default/flow/${DEFAULT_FLOW_FILE}`);
      if (!response.ok) {
        throw new Error(`Failed to load default flow: ${DEFAULT_FLOW_FILE}`);
      }
      const flowJson = await response.json();

      const importResult = await FlowService.importFlowWithNodes.importFromJson(
        flowJson,
        sessionId,
      );

      if (importResult.isFailure) {
        throw new Error(`Failed to import flow: ${importResult.getError()}`);
      }

      const clonedFlow = importResult.getValue();

      // Clone the imported character card with sessionId (AI character)
      const clonedCardResult = await CardService.cloneCard.execute({
        cardId: importedCharacter.id,
        sessionId: sessionId,
      });

      if (clonedCardResult.isFailure) {
        throw new Error(`Failed to clone character for session: ${clonedCardResult.getError()}`);
      }

      const clonedCard = clonedCardResult.getValue();

      const allCards: {
        id: UniqueEntityID;
        type: "character" | "scenario";
        enabled: boolean;
      }[] = [
        {
          id: clonedCard.id,
          type: CardType.Character,
          enabled: true,
        },
      ];

      // Create scenario card from character's 1:1 config if exists
      const hasScenario = importedCharacter.props.scenario;
      const hasFirstMessages =
        importedCharacter.props.firstMessages &&
        importedCharacter.props.firstMessages.length > 0;

      if (hasScenario || hasFirstMessages) {
        const scenarioCardResult = ScenarioCard.create({
          title: `${importedCharacter.props.name} - Scenario`,
          name: `${importedCharacter.props.name} - Scenario`,
          type: CardType.Scenario,
          tags: [],
          description: importedCharacter.props.scenario || "",
          firstMessages: importedCharacter.props.firstMessages || [],
          sessionId: sessionId,
        });

        if (scenarioCardResult.isSuccess) {
          const scenarioCard = scenarioCardResult.getValue();
          const saveScenarioResult = await CardService.saveCard.execute(scenarioCard);

          if (saveScenarioResult.isSuccess) {
            const savedScenario = saveScenarioResult.getValue();
            allCards.push({
              id: savedScenario.id,
              type: CardType.Scenario,
              enabled: true,
            });
          } else {
            logger.warn(
              "Failed to save scenario card from character 1:1 config",
              saveScenarioResult.getError(),
            );
          }
        } else {
          logger.warn(
            "Failed to create scenario card from character 1:1 config",
            scenarioCardResult.getError(),
          );
        }
      }

      // Update session with cloned resources
      session.update({
        flowId: clonedFlow.id,
        allCards,
        userCharacterCardId: undefined, // No persona for cloud imports
      });

      // Save the updated session
      const savedSessionOrError = await SessionService.saveSession.execute({
        session,
      });

      if (savedSessionOrError.isFailure) {
        throw new Error(`Failed to save updated session: ${savedSessionOrError.getError()}`);
      }

      const savedSession = savedSessionOrError.getValue();

      return {
        characterId: importedCharacter.id.toString(),
        sessionId: savedSession.id.toString(),
        sessionTitle: savedSession.name,
        characterTitle: importedCharacter.props.title,
      };
    },

    onSuccess: (result) => {
      // Invalidate card list queries to show the new imported card
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });

      // Invalidate session queries to show the new session
      queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

      // Update session store
      useSessionStore.getState().selectSession(
        new UniqueEntityID(result.sessionId),
        result.sessionTitle,
      );
    },
  });
};

/**
 * Hook for importing a scenario from cloud storage by ID
 */
export const useImportScenarioFromCloud = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["card", "importScenarioFromCloud"],
    mutationFn: async ({
      scenarioId,
      sessionId,
    }: {
      scenarioId: string;
      sessionId?: UniqueEntityID;
    }) => {
      const result = await CardService.importScenarioFromCloud.execute({
        scenarioId,
        sessionId,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return result.getValue();
    },

    onSuccess: () => {
      // Invalidate card list queries to show the new imported card
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
};
