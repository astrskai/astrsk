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
        title
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return title;
    },
    
    onMutate: async (title) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.metadata(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.content(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.lists() });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousMetadata = queryClient.getQueryData(cardKeys.metadata(cardId));
      const previousContent = queryClient.getQueryData(cardKeys.content(cardId));
      const previousLists = queryClient.getQueriesData({ queryKey: cardKeys.lists() });
      
      // Optimistic updates - metadata
      queryClient.setQueryData(cardKeys.metadata(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          name: title,
          updatedAt: new Date()
        };
      });
      
      // Optimistic update - content
      queryClient.setQueryData(cardKeys.content(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          name: title
        };
      });
      
      return { previousCard, previousMetadata, previousContent, previousLists };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(cardKeys.metadata(cardId), context.previousMetadata);
      }
      if (context?.previousContent) {
        queryClient.setQueryData(cardKeys.content(cardId), context.previousContent);
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
      }
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.metadata(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
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
        summary: cardSummary
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return cardSummary;
    },
    
    onMutate: async (cardSummary) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.metadata(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.content(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousMetadata = queryClient.getQueryData(cardKeys.metadata(cardId));
      const previousContent = queryClient.getQueryData(cardKeys.content(cardId));
      
      // Optimistic updates
      queryClient.setQueryData(cardKeys.metadata(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, description: cardSummary, updatedAt: new Date() };
      });
      
      queryClient.setQueryData(cardKeys.content(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, description: cardSummary };
      });
      
      return { previousCard, previousMetadata, previousContent };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(cardKeys.metadata(cardId), context.previousMetadata);
      }
      if (context?.previousContent) {
        queryClient.setQueryData(cardKeys.content(cardId), context.previousContent);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.metadata(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) });
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
        name
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return name;
    },
    
    onMutate: async (name) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.content(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousContent = queryClient.getQueryData(cardKeys.content(cardId));
      
      // Optimistic update - content
      queryClient.setQueryData(cardKeys.content(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, greeting: name };
      });
      
      return { previousCard, previousContent };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousContent) {
        queryClient.setQueryData(cardKeys.content(cardId), context.previousContent);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) });
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
        description
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return description;
    },
    
    onMutate: async (description) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.content(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousContent = queryClient.getQueryData(cardKeys.content(cardId));
      
      // Optimistic update
      queryClient.setQueryData(cardKeys.content(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, systemPrompt: description };
      });
      
      return { previousCard, previousContent };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousContent) {
        queryClient.setQueryData(cardKeys.content(cardId), context.previousContent);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) });
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
        exampleDialogue
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return exampleDialogue;
    },
    
    onMutate: async (exampleDialogue) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.content(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousContent = queryClient.getQueryData(cardKeys.content(cardId));
      
      // Optimistic update
      queryClient.setQueryData(cardKeys.content(cardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          exampleMessages: exampleDialogue ? [{ user: "Example", assistant: exampleDialogue }] : []
        };
      });
      
      return { previousCard, previousContent };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousContent) {
        queryClient.setQueryData(cardKeys.content(cardId), context.previousContent);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) });
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
        tags
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return tags;
    },
    
    onMutate: async (tags) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.metadata(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousMetadata = queryClient.getQueryData(cardKeys.metadata(cardId));
      
      // Optimistic update
      queryClient.setQueryData(cardKeys.metadata(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, tags };
      });
      
      return { previousCard, previousMetadata };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(cardKeys.metadata(cardId), context.previousMetadata);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.metadata(cardId) });
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
        version
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return version;
    },
    
    onMutate: async (version) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.metadata(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousMetadata = queryClient.getQueryData(cardKeys.metadata(cardId));
      
      // Optimistic update
      queryClient.setQueryData(cardKeys.metadata(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, version };
      });
      
      return { previousCard, previousMetadata };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(cardKeys.metadata(cardId), context.previousMetadata);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.metadata(cardId) });
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
        conceptualOrigin
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return conceptualOrigin;
    },
    
    onMutate: async (conceptualOrigin) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.metadata(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousMetadata = queryClient.getQueryData(cardKeys.metadata(cardId));
      
      // Optimistic update
      queryClient.setQueryData(cardKeys.metadata(cardId), (old: any) => {
        if (!old) return old;
        return { ...old, conceptualOrigin };
      });
      
      return { previousCard, previousMetadata };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(cardKeys.metadata(cardId), context.previousMetadata);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.metadata(cardId) });
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
        creator
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return creator;
    },
    
    onMutate: async (creator) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.metadata(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousMetadata = queryClient.getQueryData(cardKeys.metadata(cardId));
      
      return { previousCard, previousMetadata };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(cardKeys.metadata(cardId), context.previousMetadata);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.metadata(cardId) });
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
        lorebook
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
      const previousLorebook = queryClient.getQueryData(cardKeys.lorebook(cardId));
      
      // Optimistic update for lorebook queries
      if (lorebook) {
        queryClient.setQueryData(cardKeys.lorebook(cardId), lorebook);
      } else {
        queryClient.setQueryData(cardKeys.lorebook(cardId), null);
      }
      
      return { previousCard, previousLorebook };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousLorebook) {
        queryClient.setQueryData(cardKeys.lorebook(cardId), context.previousLorebook);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.lorebook(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.lorebook(cardId) });
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
        scenarios
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
      const previousScenarios = queryClient.getQueryData(cardKeys.scenarios(cardId));
      
      // Optimistic update for scenarios queries
      queryClient.setQueryData(cardKeys.scenarios(cardId), scenarios || []);
      
      return { previousCard, previousScenarios };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousScenarios) {
        queryClient.setQueryData(cardKeys.scenarios(cardId), context.previousScenarios);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.scenarios(cardId) });
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
        description
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return description;
    },
    
    onMutate: async (description) => {
      startEditing();
      
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.cancelQueries({ queryKey: cardKeys.content(cardId) });
      
      const previousCard = queryClient.getQueryData(cardKeys.detail(cardId));
      const previousContent = queryClient.getQueryData(cardKeys.content(cardId));
      
      return { previousCard, previousContent };
    },
    
    onError: (_err, _variables, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previousCard);
      }
      if (context?.previousContent) {
        queryClient.setQueryData(cardKeys.content(cardId), context.previousContent);
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
      
      await queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      await queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) });
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
      const result = await CardService.deleteCard.execute(new UniqueEntityID(cardId));
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return cardId;
    },
    
    onSuccess: (cardId) => {
      // Remove from all caches
      queryClient.removeQueries({ queryKey: cardKeys.detail(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.metadata(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.content(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.lorebook(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.scenarios(cardId) });
      queryClient.removeQueries({ queryKey: cardKeys.variables(cardId) });
      
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
      const result = await CardService.cloneCard.execute({ cardId: new UniqueEntityID(cardId) });
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