import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { FlowService } from "@/app/services/flow-service";
import { flowKeys } from "@/entities/flow/api/query-factory";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/**
 * Hook for exporting flows with complete node data
 */
export function useExportFlowWithNodes(flowId: string) {
  return useMutation({
    mutationFn: async () => {
      const result = await FlowService.exportFlowWithNodes.execute({flowId: new UniqueEntityID(flowId)});
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return result.getValue();
    },
    onSuccess: (file) => {
      // Trigger file download
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toastSuccess(`Flow "${file.name}" exported successfully`);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      toastError("Failed to export flow", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });
}

/**
 * Hook for importing flows with complete node data support
 */
export function useImportFlowWithNodes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      agentModelOverrides 
    }: { 
      file: File; 
      agentModelOverrides?: Map<string, {
        apiSource: string;
        modelId: string;
        modelName: string;
      }> 
    }) => {
      const result = await FlowService.importFlowWithNodes.execute({ 
        file, 
        agentModelOverrides 
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return result.getValue();
    },
    onSuccess: (flow) => {
      const flowId = flow.id.toString();
      
      // Set the flow data in cache immediately
      queryClient.setQueryData(flowKeys.detail(flowId), flow);
      
      // Invalidate flow queries to refresh lists
      queryClient.invalidateQueries({ queryKey: flowKeys.all });
      
      toastSuccess(`Flow "${flow.props.name}" imported successfully`);
      
      // Navigate to the new flow with a small delay to ensure cache is ready
      if (typeof window !== 'undefined' && window.history) {
        setTimeout(() => {
          const newUrl = `/flow/${flowId}`;
          window.history.pushState(null, '', newUrl);
          
          // Dispatch a custom event to notify components of navigation
          window.dispatchEvent(new CustomEvent('flowNavigated', { 
            detail: { flowId } 
          }));
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('Import failed:', error);
      toastError("Failed to import flow", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });
}

/**
 * Hook for legacy export support (delegates to enhanced version)
 */
export function useExportFlow(flowId: string) {
  return useExportFlowWithNodes(flowId);
}

/**
 * Hook for legacy import support (delegates to enhanced version)
 */
export function useImportFlow() {
  return useImportFlowWithNodes();
}