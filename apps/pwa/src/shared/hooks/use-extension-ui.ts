/**
 * Hook to access extension UI components
 * Provides React and UI components to extensions (NO HOOKS - violates Rules of Hooks)
 *
 * NOTE: Extensions should NOT use hooks in their render functions.
 * The host component should fetch data and pass it to extensions.
 */

import * as React from "react";
import { extensionRegistry } from "@/features/extensions/core/extension-registry";
import { UserInputCharacterButton } from "@/pages/sessions/ui/chat/user-input-character-button";
import { CardType } from "@/entities/card/domain/card";

/**
 * Get all UI components registered by extensions for a specific slot
 * @param slot - The slot name (e.g., "session-input-buttons")
 * @param context - Context data to pass to component render functions (including fetched data)
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
      CardType, // Enum for filtering cards by type
    }),
    [context]
  );

  // Return render functions instead of elements to prevent re-render issues
  // NOTE: Extensions should NOT call hooks - they receive data via context
  return React.useMemo(
    () =>
      components.map((component) => ({
        id: component.id,
        extensionId: component.extensionId,
        // Return the render function, don't call it yet
        // Extensions receive context (with data) but NO hooks
        render: () => component.render(renderContext),
      })),
    [components, renderContext]
  );
}
