import { useRef } from "react";

import { useSessionStore } from "@/shared/stores/session-store";
import { cn } from "@/shared/lib";
import { SessionMessagesAndUserInputs } from "./session-messages";

const SessionMain = ({
  onAddPlotCard,
  isOpenSettings,
}: {
  onAddPlotCard: () => void;
  isOpenSettings: boolean;
}) => {
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  const scrollAreaVieportRef = useRef<HTMLDivElement>(null);

  if (!selectedSessionId) {
    return null;
  }

  return (
    <div className={cn("h-full overflow-hidden")}>
      <SessionMessagesAndUserInputs
        onAddPlotCard={onAddPlotCard}
        isOpenSettings={isOpenSettings}
        parentRef={scrollAreaVieportRef}
      />
    </div>
  );
};

export { SessionMain };
