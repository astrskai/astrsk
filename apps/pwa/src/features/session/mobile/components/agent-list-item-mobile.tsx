import { CircleAlert } from "lucide-react";
import { cn } from "@/shared/lib";

interface AgentListItemMobileProps {
  agentName: string;
  modelName?: string;
  isModelInvalid?: boolean;
  variant?: "create" | "edit";
}

export const AgentListItemMobile = ({
  agentName,
  modelName,
  isModelInvalid,
  variant = "create",
}: AgentListItemMobileProps) => {
  return (
    <div
      className={cn(
        "relative w-full p-6 rounded flex flex-col justify-start items-start gap-6",
        variant === "create" ? "bg-background-surface-3" : "bg-background-surface-2",
        !isModelInvalid && "outline outline-1 outline-offset-[-1px] outline-border-light",
      )}
    >
      <div className="w-full flex justify-start items-center gap-6">
        <div className="w-12 text-text-primary text-base font-medium">
          Agent
        </div>
        <div className="text-text-body text-base font-normal">
          {agentName}
        </div>
      </div>
      <div className="w-full flex justify-start items-center gap-6">
        {isModelInvalid && (
          <CircleAlert className="min-w-4 min-h-4 text-status-destructive-light -mr-4" />
        )}
        <div className="w-12 text-text-primary text-base font-medium">
          Model
        </div>
        <div className="text-text-body text-base font-normal">
          {modelName}
        </div>
      </div>
      {isModelInvalid && (
        <div
          className={cn(
            "absolute inset-[-1px] rounded pointer-events-none",
            "outline-2 outline-status-destructive-light",
          )}
        />
      )}
    </div>
  );
};