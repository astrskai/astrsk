import { useMobileNavigation } from "@/app/contexts/mobile-navigation-context";
import { cn } from "@/shared/lib";
import { SessionListMobile } from "./session-list-mobile";
import { useRef } from "react";

export default function SessionPageMobile({
  className,
}: {
  className?: string;
}) {
  const { setIsOpen } = useMobileNavigation();
  const refSessionListCreate = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn("relative max-h-dvh min-h-dvh overflow-hidden", className)}
    >
      <SessionListMobile
        refSessionListCreate={refSessionListCreate}
        onMenuClick={() => setIsOpen(true)}
      />
    </div>
  );
}
