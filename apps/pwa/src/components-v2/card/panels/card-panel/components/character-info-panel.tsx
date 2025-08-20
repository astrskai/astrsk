import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { CharacterCard } from "@/modules/card/domain";
import { Input } from "@/components-v2/ui/input";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";
import { 
  cardQueries, 
  useUpdateCharacterName, 
  useUpdateCharacterDescription, 
  useUpdateCharacterExampleDialogue 
} from "@/app/queries/card";
import { 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError 
} from "@/components-v2/card/panels/hooks/use-card-panel";

interface CharacterInfoPanelProps extends CardPanelProps {}

export function CharacterInfoPanel({ cardId }: CharacterInfoPanelProps) {
  // Fine-grained mutations with optimistic updates
  const updateCharacterName = useUpdateCharacterName(cardId);
  const updateDescription = useUpdateCharacterDescription(cardId);
  const updateExampleDialogue = useUpdateCharacterExampleDialogue(cardId);
  
  // Track editing state in refs to avoid triggering effects
  const isEditingNameRef = useRef(updateCharacterName.isEditing);
  const isEditingDescRef = useRef(updateDescription.isEditing);
  const isEditingExampleRef = useRef(updateExampleDialogue.isEditing);
  
  useEffect(() => {
    isEditingNameRef.current = updateCharacterName.isEditing;
  }, [updateCharacterName.isEditing]);
  
  useEffect(() => {
    isEditingDescRef.current = updateDescription.isEditing;
  }, [updateDescription.isEditing]);
  
  useEffect(() => {
    isEditingExampleRef.current = updateExampleDialogue.isEditing;
  }, [updateExampleDialogue.isEditing]);

  // Load card data - disable refetching while editing or cursor is active
  const isAnyEditing = updateCharacterName.isEditing || updateDescription.isEditing || updateExampleDialogue.isEditing;
  const hasCursor = updateCharacterName.hasCursor || updateDescription.hasCursor || updateExampleDialogue.hasCursor;
  const queryEnabled = !!cardId && !isAnyEditing && !hasCursor;
  
  const { data: card, isLoading } = useQuery({
    ...cardQueries.detail(cardId),
    enabled: queryEnabled,
    refetchOnWindowFocus: !isAnyEditing && !hasCursor,
    refetchOnMount: false, // Don't refetch on mount - only when needed
  });
  
  // UI state (expansion, errors, etc.)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isExampleExpanded, setIsExampleExpanded] = useState(false);
  
  // Local form state (for immediate UI feedback)
  const [characterName, setCharacterName] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localExampleDialogue, setLocalExampleDialogue] = useState("");
  
  // Track initialization
  const lastCardIdRef = useRef<string | null>(null);
  
  // Track current card in ref to avoid recreating debounced functions
  const cardRef = useRef(card);
  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  // Initialize and sync data
  useEffect(() => {
    // Initialize when card changes
    if (cardId && cardId !== lastCardIdRef.current && card && card instanceof CharacterCard) {
      setCharacterName(card.props.name || "");
      setLocalDescription(card.props.description || "");
      setLocalExampleDialogue(card.props.exampleDialogue || "");
      lastCardIdRef.current = cardId;
    }
    // Sync when card changes externally (but not during editing or cursor active) - only if values actually differ
    else if (card && card instanceof CharacterCard && 
             !isEditingNameRef.current && !isEditingDescRef.current && !isEditingExampleRef.current &&
             !hasCursor) {
      const newName = card.props.name || "";
      const newDesc = card.props.description || "";
      const newExample = card.props.exampleDialogue || "";
      
      // Only update state if values actually changed
      if (characterName !== newName) {
        setCharacterName(newName);
      }
      if (localDescription !== newDesc) {
        setLocalDescription(newDesc);
      }
      if (localExampleDialogue !== newExample) {
        setLocalExampleDialogue(newExample);
      }
    }
  }, [cardId, card, characterName, localDescription, localExampleDialogue, hasCursor]);

  // Common Monaco editor mount handler with cursor tracking
  const handleDescriptionEditorMount = useCallback((editor: any) => {
    // Register editor for variable insertion
    const position = editor.getPosition();
    registerCardMonacoEditor(editor, position);

    // Track focus - mark cursor as active
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);
      updateDescription.setCursorActive(true);
    });
    
    // Track blur - mark cursor as inactive
    editor.onDidBlurEditorWidget(() => {
      updateDescription.setCursorActive(false);
    });

    // Track cursor changes
    editor.onDidChangeCursorPosition(
      (e: editor.ICursorPositionChangedEvent) => {
        registerCardMonacoEditor(editor, e.position);
      },
    );

    // Focus the editor when mounted (only for expanded views)
    if (editor.getDomNode()?.closest('.absolute.inset-0')) {
      editor.focus();
    }
  }, [updateDescription]);

  const handleExampleEditorMount = useCallback((editor: any) => {
    // Register editor for variable insertion
    const position = editor.getPosition();
    registerCardMonacoEditor(editor, position);

    // Track focus - mark cursor as active
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);
      updateExampleDialogue.setCursorActive(true);
    });
    
    // Track blur - mark cursor as inactive
    editor.onDidBlurEditorWidget(() => {
      updateExampleDialogue.setCursorActive(false);
    });

    // Track cursor changes
    editor.onDidChangeCursorPosition(
      (e: editor.ICursorPositionChangedEvent) => {
        registerCardMonacoEditor(editor, e.position);
      },
    );

    // Focus the editor when mounted (only for expanded views)
    if (editor.getDomNode()?.closest('.absolute.inset-0')) {
      editor.focus();
    }
  }, [updateExampleDialogue]);

  // Debounced save using fine-grained mutations
  const debouncedSaveName = useMemo(
    () => debounce((name: string) => {
      const card = cardRef.current;
      if (!card || !(card instanceof CharacterCard)) return;
      const currentName = card.props.name || "";
      if (name.trim() !== currentName && name.trim()) {
        updateCharacterName.mutate(name.trim());
      }
    }, 300),
    [updateCharacterName]
  );

  const debouncedSaveDescription = useMemo(
    () => debounce((desc: string) => {
      const card = cardRef.current;
      if (!card || !(card instanceof CharacterCard)) return;
      const currentDesc = card.props.description || "";
      if (desc !== currentDesc) {
        updateDescription.mutate(desc);
      }
    }, 300),
    [updateDescription]
  );

  const debouncedSaveExample = useMemo(
    () => debounce((example: string) => {
      const card = cardRef.current;
      if (!card || !(card instanceof CharacterCard)) return;
      const currentExample = card.props.exampleDialogue || "";
      if (example !== currentExample) {
        updateExampleDialogue.mutate(example);
      }
    }, 300),
    [updateExampleDialogue]
  );

  // Use refs to track content without causing re-renders
  const localDescriptionRef = useRef(localDescription);
  const localExampleRef = useRef(localExampleDialogue);
  
  useEffect(() => {
    localDescriptionRef.current = localDescription;
  }, [localDescription]);
  
  useEffect(() => {
    localExampleRef.current = localExampleDialogue;
  }, [localExampleDialogue]);

  // Change handlers for individual fields
  const handleNameChange = useCallback((value: string) => {
    setCharacterName(value);
    debouncedSaveName(value);
  }, [debouncedSaveName]);

  const handleDescriptionChange = useCallback((value: string) => {
    setLocalDescription(value);
    debouncedSaveDescription(value);
  }, [debouncedSaveDescription]);

  const handleExampleDialogChange = useCallback((value: string) => {
    setLocalExampleDialogue(value);
    debouncedSaveExample(value);
  }, [debouncedSaveExample]);

  // Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading character info..." />;
  }

  if (!card || !(card instanceof CharacterCard)) {
    return <CardPanelError message="Character info is only available for character cards" />;
  }

  // Render
  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4 overflow-hidden relative">

      {/* Character name */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Character name
          </div>
          {updateCharacterName.isError && (
            <div className="text-red-500 text-[10px] font-medium">Error</div>
          )}
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <Input
            value={characterName}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => updateCharacterName.setCursorActive(true)}
            onBlur={() => updateCharacterName.setCursorActive(false)}
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
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Description
          </div>
          {updateDescription.isError && (
            <div className="text-red-500 text-[10px] font-medium">Error</div>
          )}
        </div>
        <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
          <div className="self-stretch flex-1 min-w-0">
            <Editor
              key={`description-${cardId}`}
              value={localDescription}
              onChange={(value) => handleDescriptionChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isDescriptionExpanded}
              onExpandToggle={setIsDescriptionExpanded}
              onMount={handleDescriptionEditorMount}
              containerClassName="h-full"
              clearUndoOnValueChange={true}
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
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Example dialog
          </div>
          {updateExampleDialogue.isError && (
            <div className="text-red-500 text-[10px] font-medium">Error</div>
          )}
        </div>
        <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
          <div className="self-stretch flex-1 min-w-0">
            <Editor
              key={`example-${cardId}`}
              value={localExampleDialogue}
              onChange={(value) => handleExampleDialogChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isExampleExpanded}
              onExpandToggle={setIsExampleExpanded}
              onMount={handleExampleEditorMount}
              containerClassName="h-full"
              clearUndoOnValueChange={true}
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
              key={`description-expanded-${cardId}`}
              value={localDescription}
              onChange={(value) => handleDescriptionChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isDescriptionExpanded}
              onExpandToggle={setIsDescriptionExpanded}
              onMount={handleDescriptionEditorMount}
              containerClassName="h-full"
              clearUndoOnValueChange={true}
            />
          </div>
        </div>
      )}

      {isExampleExpanded && (
        <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
          <div className="w-full h-full">
            <Editor
              key={`example-expanded-${cardId}`}
              value={localExampleDialogue}
              onChange={(value) => handleExampleDialogChange(value || "")}
              language="markdown"
              expandable={true}
              isExpanded={isExampleExpanded}
              onExpandToggle={setIsExampleExpanded}
              onMount={handleExampleEditorMount}
              containerClassName="h-full"
              clearUndoOnValueChange={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}