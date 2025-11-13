import { cn } from "@/shared/lib";

interface SessionDataSidebarProps {
  isOpen: boolean;
}

export default function SessionDataSidebar({
  isOpen,
}: SessionDataSidebarProps) {
  return (
    <aside
      className={cn(
        "w-80 bg-transparent transition-all duration-300 ease-in-out",
        // Mobile: fixed overlay with slide animation
        "fixed top-10 bottom-0 left-0 z-10",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: relative layout with opacity + max-width animation
        "md:relative md:top-0 md:h-dvh md:translate-x-0 md:pt-28",
        isOpen
          ? "md:max-w-80 md:opacity-100"
          : "md:max-w-0 md:overflow-hidden md:opacity-0",
      )}
    >
      <div className="p-4">
        <div className="rounded-md border border-gray-50/20 bg-gray-50/20 p-4 backdrop-blur-lg">
          apple
        </div>
      </div>
    </aside>
  );
}
