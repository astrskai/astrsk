import { useMobileNavigation } from "@/App";
import { cn } from "@/components-v2/lib/utils";
import { SessionListMobile } from "./session-list-mobile";
import { useRef } from "react";

export default function SessionPageMobile({ className }: { className?: string }) {
  const { setIsOpen } = useMobileNavigation();
  const refSessionListCreate = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn("relative min-h-dvh max-h-dvh overflow-hidden", className)}
    >
      <SessionListMobile
        refSessionListCreate={refSessionListCreate}
        onMenuClick={() => setIsOpen(true)}
      />
    </div>
  );
}