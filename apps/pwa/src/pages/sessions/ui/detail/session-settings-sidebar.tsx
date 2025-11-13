import { cn } from "@/shared/lib";
import { ChevronLeft, EllipsisVertical } from "lucide-react";

interface SessionSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionSettingsSidebar({
  isOpen,
  onClose,
}: SessionSettingsSidebarProps) {
  return (
    <aside
      className={cn(
        "bg-background-primary fixed top-0 right-0 z-30 h-full w-90 overflow-y-auto",
        "transition-transform duration-300 ease-in-out",
        "shadow-[-8px_0_24px_-4px_rgba(0,0,0,0.5)]",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-gray-300 hover:text-gray-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-gray-50">Settings</span>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-gray-300 hover:text-gray-50"
        >
          <EllipsisVertical className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">content</div>
    </aside>
  );
}
