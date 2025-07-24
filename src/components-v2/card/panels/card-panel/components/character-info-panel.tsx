import { useState, useEffect, useCallback, useMemo } from "react";
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { CharacterCard } from "@/modules/card/domain";
import { Input } from "@/components-v2/ui/input";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";
import { 
  useCardPanel, 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError 
} from "@/components-v2/card/panels/hooks/use-card-panel";

interface CharacterInfoPanelProps extends CardPanelProps {}

export function CharacterInfoPanel({ cardId }: CharacterInfoPanelProps) {
  // 1. Use abstraction hook for card panel functionality
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<CharacterCard>({
    cardId,
  });
  
  // 2. UI state (expansion, errors, etc.)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isExampleExpanded, setIsExampleExpanded] = useState(false);
  
  // 3. Local form state (for immediate UI feedback)
  const [characterName, setCharacterName] = useState("");
  const [description, setDescription] = useState("");
  const [exampleDialogue, setExampleDialogue] = useState("");

  // 4. SINGLE initialization useEffect (right after state)
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card && card instanceof CharacterCard) {
      setCharacterName(card.props.name || "");
      setDescription(card.props.description || "");
      setExampleDialogue(card.props.exampleDialogue || "");
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
    () => debounce((name: string, desc: string, example: string) => {
      if (!card || !(card instanceof CharacterCard)) return;

      // Check for actual changes before saving
      if (
        name.trim() === (card.props.name || card.props.title || "") &&
        desc === (card.props.description || "") &&
        example === (card.props.exampleDialogue || "")
      ) {
        return;
      }

      const updateResult = card.update({
        name: name.trim(),
        description: desc,
        exampleDialogue: example,
      });

      if (updateResult.isSuccess) {
        saveCard(card);
      }
    }, 300),
    [card, saveCard]
  );

  // 7. Change handlers that pass current values
  const handleNameChange = useCallback((value: string) => {
    setCharacterName(value);
    debouncedSave(value, description, exampleDialogue);
  }, [debouncedSave, description, exampleDialogue]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    debouncedSave(characterName, value, exampleDialogue);
  }, [debouncedSave, characterName, exampleDialogue]);

  const handleExampleDialogChange = useCallback((value: string) => {
    setExampleDialogue(value);
    debouncedSave(characterName, description, value);
  }, [debouncedSave, characterName, description]);

  // 8. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading character info..." />;
  }

  if (!card || !(card instanceof CharacterCard)) {
    return <CardPanelError message="Character info is only available for character cards" />;
  }

  // 9. Render
  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4 overflow-hidden relative">

      {/* Character name */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Character name
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <Input
            value={characterName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
            placeholder=""
          />
          <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
            <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
              {"{{char.name}}"}
            </div>
          </div>
        </div>
      </div>

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
              isExpanded={isDescriptionExpanded}
              onExpandToggle={setIsDescriptionExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
          <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
            <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
              {"{{char.description}}"}
            </div>
          </div>
        </div>
      </div>

      {/* Example dialog */}
      <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2 min-w-0 overflow-hidden">
        <div className="self-stretch justify-start text-text-body text-[10px] font-medium leading-none">
          Example dialog
        </div>
        <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
          <div className="self-stretch flex-1 min-w-0">
            <Editor
              value={exampleDialogue}
              onChange={(value) => handleExampleDialogChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isExampleExpanded}
              onExpandToggle={setIsExampleExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
          <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
            <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
              {"{{char.example_dialog}}"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Editor Views */}
      {isDescriptionExpanded && (
        <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
          <div className="w-full h-full">
            <Editor
              value={description}
              onChange={(value) => handleDescriptionChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isDescriptionExpanded}
              onExpandToggle={setIsDescriptionExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
        </div>
      )}

      {isExampleExpanded && (
        <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
          <div className="w-full h-full">
            <Editor
              value={exampleDialogue}
              onChange={(value) => handleExampleDialogChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isExampleExpanded}
              onExpandToggle={setIsExampleExpanded}
              onMount={handleEditorMount}
              containerClassName="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}