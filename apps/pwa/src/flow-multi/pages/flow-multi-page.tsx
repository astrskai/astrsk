import { cn } from "@/shared/lib/cn";

// Import components
import { FlowPanelMain } from "../panels/flow-panel-main";

export default function FlowMultiPage({ className }: { className?: string }) {
  return (
    <div className={cn("h-full w-full", className)}>
      <FlowPanelMain />
    </div>
  );
}
