import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components-v2/ui/button";

interface GlobalSchemaPanelProps {
  flowId: string;
}

export function GlobalSchemaPanel({ flowId }: GlobalSchemaPanelProps) {
  const [schemas, setSchemas] = useState<any[]>([]);

  return (
    <div className="h-full flex flex-col bg-background-surface-2 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">Global Schema</h3>
          <Button
            variant="secondary"
            size="sm"
          >
            <Plus className="min-w-4 min-h-4 mr-2" />
            Add Schema Field
          </Button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-subtle text-xs mb-4">
              Global Schema Panel - Coming Soon
            </p>
            <p className="text-text-subtle text-xs">
              This panel will manage flow-level schema definitions
              that can be shared across all agents in the flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}