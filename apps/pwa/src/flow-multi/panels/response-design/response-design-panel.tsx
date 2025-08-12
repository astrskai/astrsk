// Response design panel component for Dockview multi-panel layout
// Handles response template design with auto-save

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { debounce } from "lodash-es";
import { Check, Loader2, Variable, Database } from "lucide-react";

import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { TypoLarge, TypoSmall } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import { toast } from "sonner";

// Import flow services and queries directly
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { invalidateSingleFlowQueries } from "@/flow-multi/utils/invalidate-flow-queries";

interface ResponseDesignPanelProps {
  flowId: string;
}

export function ResponseDesignPanel({ flowId }: ResponseDesignPanelProps) {
  // 1. Load flow data using global queryClient settings
  const { 
    data: flow, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    ...flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
    enabled: !!flowId,
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
  });

  // 2. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 3. Local UI state
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Track initialization
  const lastFlowIdRef = useRef<string | null>(null);
  const lastSavedTemplateRef = useRef<string>("");


  // Initialize template only when flowId changes
  // This is the safest approach to avoid infinite loops
  useEffect(() => {
    if (!flow) return;
    
    // Only initialize when flowId actually changes
    if (flowId !== lastFlowIdRef.current) {
      const template = flow.props.responseTemplate || "";
      setCurrentTemplate(template);
      lastSavedTemplateRef.current = template;
      setHasUnsavedChanges(false);
      lastFlowIdRef.current = flowId;
    }
  }, [flowId]) // Only depend on flowId, access flow without adding to deps
  

  // Removed dirty state tracking as dirty checking is no longer needed

  // Store flow in ref to avoid recreating save function
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);
  
  // Save response template
  const saveResponseTemplate = useCallback(
    async (template: string) => {
      const currentFlow = flowRef.current;
      if (!currentFlow) return;

      try {
        const updatedFlow = currentFlow.update({
          responseTemplate: template,
        });

        if (updatedFlow.isFailure) {
          throw new Error(updatedFlow.getError());
        }

        // Save with invalidation so other components see the changes
        const result = await FlowService.saveFlow.execute(updatedFlow.getValue());
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        
        // Invalidate flow queries so other components see the updated response template
        await invalidateSingleFlowQueries(currentFlow.id);
        
        // Update last saved template and clear unsaved changes flag
        lastSavedTemplateRef.current = template;
        setHasUnsavedChanges(false);
      } catch (error) {
        toast.error("Failed to save response template", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [] // No dependencies - uses ref instead
  );

  // Debounced auto-save
  const debouncedSave = useMemo(
    () => debounce((template: string) => {
      saveResponseTemplate(template);
    }, 1000), // Increased debounce to 1 second to prevent rapid saves
    [saveResponseTemplate]
  );
  
  // Cleanup: flush pending saves on unmount
  useEffect(() => {
    return () => {
      // Flush any pending saves when panel is closed
      debouncedSave.flush();
      // Reset unsaved changes flag on unmount
      setHasUnsavedChanges(false);
    };
  }, [debouncedSave]);

  // Handle template change
  const handleTemplateChange = useCallback(
    (template: string | undefined) => {
      if (template === undefined) return;
      
      setCurrentTemplate(template);
      
      // Mark as having unsaved changes if different from last saved
      const hasChanged = template !== lastSavedTemplateRef.current;
      setHasUnsavedChanges(hasChanged);
      
      // Only save if template has actually changed
      if (hasChanged) {
        debouncedSave(template);
      }
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

  if (!flow || error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111]">
        <div className="text-text-subtle">
          {error ? 'Error loading flow' : 'Flow not found'}
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
