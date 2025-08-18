// Response design panel component for Dockview multi-panel layout
// Handles response template design with auto-save using mutation system

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { debounce } from "lodash-es";
import { Loader2 } from "lucide-react";

import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { toast } from "sonner";

// Import flow queries and mutations
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow/query-factory";
import { useUpdateResponseTemplate } from "@/app/queries/flow/mutations";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";

interface ResponseDesignPanelProps {
  flowId: string;
}

export function ResponseDesignPanel({ flowId }: ResponseDesignPanelProps) {
  // 1. Get the mutation hook with edit mode support
  const updateResponseTemplate = useUpdateResponseTemplate(flowId);
  
  // 2. Load just the response template - more efficient than loading entire flow
  const { 
    data: responseTemplate, 
    isLoading,
    error
  } = useQuery({
    ...flowQueries.response(flowId),
    enabled: !!flowId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 3. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 4. Local UI state for the editor
  const [currentTemplate, setCurrentTemplate] = useState("");
  
  // Track initialization
  const lastFlowIdRef = useRef<string | null>(null);

  // Initialize template when it loads or flowId changes
  useEffect(() => {
    if (responseTemplate === undefined) return;
    
    // Initialize when flowId changes or on first load
    if (flowId !== lastFlowIdRef.current) {
      setCurrentTemplate(responseTemplate);
      lastFlowIdRef.current = flowId;
    }
    // Don't sync after initialization - let local state be the source of truth
  }, [flowId, responseTemplate]);

  // Debounced save
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
    [] // Empty deps - stable reference
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (template: string | undefined) => {
      if (template === undefined) return;
      
      setCurrentTemplate(template);
      
      // Only save if template has actually changed from saved value
      if (template !== responseTemplate) {
        debouncedSave(template);
      }
    },
    [debouncedSave, responseTemplate]
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
      });
      
      editorInstance.onDidBlurEditorWidget(() => {
        // Clear editor tracking when focus lost
        setLastMonacoEditor(null, null, null, null);
      });
      
      // Update position on cursor change
      editorInstance.onDidChangeCursorPosition((e: any) => {
        setLastMonacoEditor(null, `responseDesign-${flowId}`, editorInstance, e.position);
      });
    },
    [setLastMonacoEditor, flowId]
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
