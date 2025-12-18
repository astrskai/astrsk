/**
 * Hook to access extension UI components
 * Provides React, hooks, queries, and UI components to extensions
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { extensionRegistry } from "@/features/extensions/core/extension-registry";
import { UserInputCharacterButton } from "@/pages/sessions/ui/chat/user-inputs";
import { sessionQueries } from "@/entities/session/api/query-factory";
import { CardType } from "@/entities/card/domain/card";

/**
 * Get all UI components registered by extensions for a specific slot
 * @param slot - The slot name (e.g., "session-input-buttons")
 * @param context - Context data to pass to component render functions
 */
export function useExtensionUI(slot: string, context?: any) {
  // Get components on every render since extensions load asynchronously
  // This ensures we pick up extensions that loaded after initial mount
  const components = extensionRegistry.getUIComponentsForSlot(slot);

  // Slot-specific context (React, components, disabled, callbacks, etc.)
  const renderContext = React.useMemo(
    () => ({
      ...context,
      React,
      components: {
        UserInputCharacterButton,
        // Future components can be added here
      },
    }),
    [context]
  );

  // React hooks for reactive data
  const hooks = React.useMemo(
    () => ({
      useQuery,
      // Future hooks can be added here (useMutation, etc.)
    }),
    []
  );

  // Query factories for reactive data access (shares app's cache)
  const queries = React.useMemo(
    () => ({
      sessionQueries,
      CardType, // Enum for filtering cards by type
      // Future query factories can be added here (flowQueries, etc.)
    }),
    []
  );

  // Memoize the component elements to prevent hook order changes
  return React.useMemo(
    () =>
      components.map((component) => ({
        id: component.id,
        extensionId: component.extensionId,
        // Call render once and memoize the result
        element: component.render(renderContext, hooks, queries),
      })),
    [components, renderContext, hooks, queries]
  );
}
