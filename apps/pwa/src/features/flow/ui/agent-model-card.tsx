import { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/ui";

export interface AgentModelCardProps {
  agentName: string;
  originalModel?: string;
  recommendedTier?: string;
  isExportMode?: boolean; // To differentiate between export and import
  children?: ReactNode; // For the selection component (ModelItem for import, RadioGroup for export)
}

export function AgentModelCard({
  agentName,
  originalModel,
  recommendedTier,
  isExportMode,
  children,
}: AgentModelCardProps) {
  return (
    <div className="w-full p-4 bg-surface-overlay rounded outline-0 inline-flex flex-col justify-start items-start gap-2">
      <div className="self-stretch flex flex-col justify-start items-start gap-4">
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch justify-start text-fg-subtle text-base font-normal leading-relaxed">
            Agent : {agentName}
          </div>
        </div>

        {isExportMode ? (
          // Export mode - only show Model
          <div className="w-full flex flex-col justify-start items-start gap-2">
            <div className="self-stretch justify-start text-fg-subtle text-base font-normal leading-relaxed">
              Model
            </div>
            <div className="self-stretch justify-start text-fg-default text-base font-normal leading-relaxed">
              {originalModel || "No model"}
            </div>
          </div>
        ) : (
          // Import mode - show both Flow original model and Recommended model tier
          <div className="self-stretch inline-flex justify-start items-start gap-4">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-fg-subtle text-base font-normal leading-relaxed">
                Flow original model
              </div>
              <div className="self-stretch flex-1 justify-start text-fg-default text-base font-normal leading-relaxed">
                {originalModel || "No model"}
              </div>
            </div>
            {recommendedTier && (
              <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                <div className="self-stretch justify-start text-fg-subtle text-base font-normal leading-relaxed">
                  Recommended model tier
                </div>
                <div className="self-stretch justify-start text-fg-default text-base font-normal leading-relaxed capitalize">
                  {recommendedTier}
                </div>
              </div>
            )}
          </div>
        )}

        {children && (
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            {isExportMode ? (
              <div className="self-stretch inline-flex justify-start items-center gap-1.5">
                <div className="justify-start text-fg-subtle text-base font-medium leading-relaxed">
                  Recommended model tier
                </div>
                <TooltipProvider>
                  <Tooltip defaultOpen={false}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center"
                        tabIndex={-1}
                        onFocus={(e) => e.preventDefault()}
                      >
                        <CircleHelp className="w-4 h-4 text-fg-subtle cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs z-[9999]">
                      <div className="flex flex-col gap-1">
                        <div><strong>Light:</strong> Fast, efficient models for basic tasks</div>
                        <div><strong>Heavy:</strong> Advanced models with higher capabilities</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div className="self-stretch justify-start text-fg-subtle text-base font-medium leading-relaxed">
                Select model to connect
              </div>
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}