import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Editor } from "@/shared/ui";
import type { editor } from "monaco-editor";
import { PlotCard } from "@/modules/card/domain";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";

// Import queries and mutations
import { cardQueries, useUpdatePlotDescription } from "@/app/queries/card";

import {
  CardPanelProps,
  CardPanelLoading,
  CardPanelError,
} from "@/features/card/panels/hooks/use-card-panel";

interface PlotInfoPanelProps extends CardPanelProps {}

export function PlotInfoPanel({ cardId }: PlotInfoPanelProps) {
  // 1. Mutation for updating plot description
  const updatePlotDescription = useUpdatePlotDescription(cardId);

  // 2. Query for card data - disable refetching while editing or cursor is active
  const { data: card, isLoading } = useQuery({
    ...cardQueries.detail(cardId),
    enabled:
      !!cardId &&
      !updatePlotDescription.isEditing &&
      !updatePlotDescription.hasCursor,
  });

  // 3. UI state (expansion, errors, etc.)
  const [isExpanded, setIsExpanded] = useState(false);

  // 4. Local form state (for immediate UI feedback)
  const [description, setDescription] = useState("");

  // 5. Refs
  const lastInitializedCardId = useRef<string | null>(null);

  // 6. Initialize and sync data (cross-tab synchronization)
  useEffect(() => {
    // Initialize when card changes
    if (cardId && cardId !== lastInitializedCardId.current && card) {
      if (card instanceof PlotCard) {
        setDescription(card.props.description || "");
      } else {
        setDescription("");
      }
      lastInitializedCardId.current = cardId;
    }
    // Sync when card changes externally (cross-tab sync) - but not during editing
    else if (
      card &&
      !updatePlotDescription.isEditing &&
      !updatePlotDescription.hasCursor
    ) {
      if (card instanceof PlotCard) {
        const newDescription = card.props.description || "";
        // Only update if description actually changed
        if (description !== newDescription) {
          setDescription(newDescription);
        }
      } else if (description !== "") {
        setDescription("");
      }
    }
  }, [
    cardId,
    card,
    updatePlotDescription.isEditing,
    updatePlotDescription.hasCursor,
    description,
  ]);

  // 7. Common Monaco editor mount handler with cursor tracking
  const handleEditorMount = useCallback(
    (editor: any) => {
      // Register editor for variable insertion
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);

      // Track focus - mark cursor as active
      editor.onDidFocusEditorWidget(() => {
        const position = editor.getPosition();
        registerCardMonacoEditor(editor, position);
        updatePlotDescription.setCursorActive(true);
      });

      // Track blur - mark cursor as inactive
      editor.onDidBlurEditorWidget(() => {
        updatePlotDescription.setCursorActive(false);
      });

      // Track cursor changes
      editor.onDidChangeCursorPosition(
        (e: editor.ICursorPositionChangedEvent) => {
          registerCardMonacoEditor(editor, e.position);
        },
      );

      // Focus the editor when mounted (only for expanded views)
      if (editor.getDomNode()?.closest(".absolute.inset-0")) {
        editor.focus();
      }
    },
    [updatePlotDescription],
  );

  // 8. Helper function to save description using mutation
  const saveDescription = useCallback(
    (newDescription: string) => {
      if (!card || !(card instanceof PlotCard)) return;

      // Check for actual changes inline
      const currentDescription = card.props.description || "";

      // If no changes, don't save
      if (newDescription === currentDescription) {
        return;
      }

      updatePlotDescription.mutate(newDescription);
    },
    [card, updatePlotDescription],
  );

  // 9. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () =>
      debounce((desc: string) => {
        saveDescription(desc);
      }, 300),
    [saveDescription],
  );

  // 10. Change handlers that pass current values
  const handleDescriptionChange = useCallback(
    (value: string) => {
      setDescription(value);
      debouncedSave(value);
    },
    [debouncedSave],
  );

  // 11. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading plot info..." />;
  }

  if (!card) {
    return <CardPanelError message="Card not found" />;
  }

  if (!(card instanceof PlotCard)) {
    return (
      <CardPanelError message="Plot info is only available for plot cards" />
    );
  }

  // 12. Render
  return (
    <div className="bg-background-surface-2 relative flex h-full w-full flex-col gap-4 overflow-hidden p-4">
      {/* Scenario */}
      <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-2 self-stretch overflow-hidden">
        <div className="text-text-body justify-start self-stretch text-[10px] leading-none font-medium">
          Scenario
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-1 self-stretch overflow-hidden">
          <div className="min-w-0 flex-1 self-stretch">
            <Editor
              value={description}
              onChange={(value) => handleDescriptionChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isExpanded}
              onExpandToggle={setIsExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
          <div className="inline-flex items-center justify-center gap-2 self-stretch px-4">
            <div className="text-text-info flex-1 justify-start text-[10px] leading-none font-medium">
              {"{{session.scenario}}"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Editor View */}
      {isExpanded && (
        <div className="bg-background-surface-2 absolute inset-0 z-20 p-4">
          <div className="h-full w-full">
            <Editor
              value={description}
              onChange={(value) => handleDescriptionChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isExpanded}
              onExpandToggle={setIsExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
