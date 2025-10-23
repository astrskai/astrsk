// Response design panel component for Dockview multi-panel layout
// Handles response template design with auto-save using mutation system

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { debounce } from "lodash-es";
import { Loader2 } from "lucide-react";

import { Editor } from "@/shared/ui";
import type { editor } from "monaco-editor";
import { toast } from "sonner";

// Import flow queries and mutations
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow/query-factory";
import { useUpdateResponseTemplate } from "@/app/queries/flow/mutations";
import { useFlowPanelContext } from "@/features/flow/flow-multi/components/flow-panel-provider";

interface ResponseDesignPanelProps {
  flowId: string;
}

export function ResponseDesignPanel({ flowId }: ResponseDesignPanelProps) {
  // 1. Get the mutation hook with edit mode support
  const updateResponseTemplate = useUpdateResponseTemplate(flowId);
  
  // 2. Load just the response template - more efficient than loading entire flow
  // Disable refetching while editing or cursor is active to prevent UI jumping
  const queryEnabled = !!flowId && !updateResponseTemplate.isEditing && !updateResponseTemplate.hasCursor;
  
  const { 
    data: responseTemplate, 
    isLoading,
    error
  } = useQuery({
    ...flowQueries.response(flowId),
    enabled: queryEnabled,
    refetchOnWindowFocus: queryEnabled,
    refetchOnMount: false, // Don't refetch on mount - only when needed
  });

  // 3. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 4. Local UI state for the editor
  const [currentTemplate, setCurrentTemplate] = useState("");
  
  // Track initialization
  const lastFlowIdRef = useRef<string | null>(null);
  
  // Track editing state in a ref to avoid triggering effects
  const isEditingRef = useRef(updateResponseTemplate.isEditing);
  const hasCursorRef = useRef(updateResponseTemplate.hasCursor);
  useEffect(() => {
    isEditingRef.current = updateResponseTemplate.isEditing;
    hasCursorRef.current = updateResponseTemplate.hasCursor;
  }, [updateResponseTemplate.isEditing, updateResponseTemplate.hasCursor]);

  // Initialize and sync template
  useEffect(() => {
    // Don't sync while editing OR while cursor is active
    if (updateResponseTemplate.isEditing || updateResponseTemplate.hasCursor) {
      return;
    }
    
    // Initialize when flow changes
    if (flowId && flowId !== lastFlowIdRef.current && responseTemplate !== undefined) {
      setCurrentTemplate(responseTemplate);
      lastFlowIdRef.current = flowId;
    }
    // Sync when response template changes externally (but not during editing or cursor active)
    else if (responseTemplate !== undefined) {
      setCurrentTemplate(responseTemplate);
    }
  }, [flowId, responseTemplate, updateResponseTemplate.isEditing, updateResponseTemplate.hasCursor]);

  // Debounced save - only recreate when target changes
  const debouncedSave = useMemo(
    () => debounce((template: string) => {
      updateResponseTemplate.mutate(template, {
        onError: (error) => {
          toast.error("Failed to save response template", {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });
    }, 1000),
    [updateResponseTemplate]
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (template: string | undefined) => {
      if (template === undefined) return;
      
      setCurrentTemplate(template);
      debouncedSave(template);
    },
    [debouncedSave]
  );

  // Handle editor mount for variable insertion tracking (no redundancy)
  const handleEditorMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorInstance.onDidFocusEditorWidget(() => {
        // Track editor and cursor position for variable insertion
        const position = editorInstance.getPosition();
        if (position) {
          setLastMonacoEditor(null, `responseDesign-${flowId}`, editorInstance, position);
        }
        // Mark cursor as active when editor is focused
        updateResponseTemplate.setCursorActive(true);
      });
      
      editorInstance.onDidBlurEditorWidget(() => {
        // Clear editor tracking when focus lost
        setLastMonacoEditor(null, null, null, null);
        // Mark cursor as inactive when editor loses focus
        updateResponseTemplate.setCursorActive(false);
      });
      
      // Update position on cursor change
      editorInstance.onDidChangeCursorPosition((e: any) => {
        setLastMonacoEditor(null, `responseDesign-${flowId}`, editorInstance, e.position);
      });
    },
    [setLastMonacoEditor, flowId, updateResponseTemplate]
  );


  // Early returns for loading/error states
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111]">
        <div className="flex items-center gap-2 text-text-subtle">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading response design panel...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111]">
        <div className="text-text-subtle">
          Error loading response template
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#111111] p-2">
      {/* Full-page Monaco editor */}
      <div className="flex-1">
        <Editor
          value={currentTemplate}
          onChange={handleTemplateChange}
          language="twig"
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}
