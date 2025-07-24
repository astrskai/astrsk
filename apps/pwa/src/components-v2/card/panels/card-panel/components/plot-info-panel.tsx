import { useState, useEffect, useCallback, useMemo } from "react";
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { PlotCard } from "@/modules/card/domain";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";
import { 
  useCardPanel, 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError 
} from "@/components-v2/card/panels/hooks/use-card-panel";

interface PlotInfoPanelProps extends CardPanelProps {}

export function PlotInfoPanel({ cardId }: PlotInfoPanelProps) {
  // 1. Use abstraction hook for card panel functionality
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<PlotCard>({
    cardId,
  });
  
  // 2. UI state (expansion, errors, etc.)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 3. Local form state (for immediate UI feedback)
  const [description, setDescription] = useState("");

  // 4. SINGLE initialization useEffect (right after state)
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card && card instanceof PlotCard) {
      setDescription(card.props.description || "");
      lastInitializedCardId.current = cardId;
    }
  }, [cardId, card, lastInitializedCardId]);

  // 5. Common Monaco editor mount handler
  const handleEditorMount = useCallback((editor: any) => {
    // Register editor for variable insertion
    const position = editor.getPosition();
    registerCardMonacoEditor(editor, position);

    // Track cursor changes
    editor.onDidChangeCursorPosition(
      (e: editor.ICursorPositionChangedEvent) => {
        registerCardMonacoEditor(editor, e.position);
      },
    );

    // Track focus
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);
    });

    // Focus the editor when mounted (only for expanded views)
    if (editor.getDomNode()?.closest('.absolute.inset-0')) {
      editor.focus();
    }
  }, []);

  // 6. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () => debounce((desc: string) => {
      if (!card || !(card instanceof PlotCard)) return;

      // Check for actual changes before saving
      if (desc === (card.props.description || "")) return;

      const updateResult = card.update({
        description: desc.trim(),
      });

      if (updateResult.isSuccess) {
        saveCard(card);
      }
    }, 300),
    [card, saveCard]
  );

  // 7. Change handlers that pass current values
  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    debouncedSave(value);
  }, [debouncedSave]);

  // 8. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading plot info..." />;
  }

  if (!card || !(card instanceof PlotCard)) {
    return <CardPanelError message="Plot info is only available for plot cards" />;
  }

  // 9. Render
  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4 overflow-hidden relative">

      {/* Description */}
      <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2 min-w-0 overflow-hidden">
        <div className="self-stretch justify-start text-text-body text-[10px] font-medium leading-none">
          Description
        </div>
        <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
          <div className="self-stretch flex-1 min-w-0">
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
          <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
            <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
              {"{{session.scenario}}"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Editor View */}
      {isExpanded && (
        <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
          <div className="w-full h-full">
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