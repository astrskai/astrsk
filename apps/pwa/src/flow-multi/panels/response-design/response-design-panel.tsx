// Response design panel component for Dockview multi-panel layout
// Handles response template design with auto-save

import { useCallback, useEffect, useState, useRef } from "react";
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

interface ResponseDesignPanelProps {
  flowId: string;
}

export function ResponseDesignPanel({ flowId }: ResponseDesignPanelProps) {
  // 1. Load flow data using global queryClient settings
  const { 
    data: flow, 
    isLoading,
    error 
  } = useQuery({
    ...flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
    enabled: !!flowId,
  });

  // 2. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 3. Local UI state
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [originalTemplate, setOriginalTemplate] = useState<string | null>(null);
  
  // Track initialization to prevent loops - only respond to flowId changes
  const lastFlowIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Helper function to check if template has actually changed
  const hasTemplateChanged = useCallback((template: string) => {
    if (originalTemplate === null) return false;
    return template !== originalTemplate;
  }, [originalTemplate]);

  // Initialize template only when flowId changes, not when flow data changes
  useEffect(() => {
    if (flow && flowId !== lastFlowIdRef.current) {
      const template = flow.props.responseTemplate || "";
      setCurrentTemplate(template);
      setOriginalTemplate(template);
      isInitializedRef.current = true;
      lastFlowIdRef.current = flowId;
    }
  }, [flowId, flow]);

  // Removed dirty state tracking as dirty checking is no longer needed

  // Save response template
  const saveResponseTemplate = useCallback(
    async (template: string) => {
      if (!flow) return;

      try {
        const updatedFlow = flow.update({
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
        
        // Update original template to reflect the saved state
        setOriginalTemplate(template);
      } catch (error) {
        toast.error("Failed to save response template", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [flow]
  );

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((template: string) => {
      saveResponseTemplate(template);
    }, 1000), // Increased debounce to 1 second to prevent rapid saves
    [saveResponseTemplate]
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (template: string | undefined) => {
      if (template === undefined) return;
      
      setCurrentTemplate(template);
      
      // Only save if template has actually changed (removed dirty state tracking)
      if (hasTemplateChanged(template)) {
        debouncedSave(template);
      }
    },
    [debouncedSave, hasTemplateChanged]
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
