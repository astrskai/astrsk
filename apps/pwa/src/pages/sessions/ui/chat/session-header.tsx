import { ArrowLeft, Pencil, ChartNoAxesColumnIncreasing } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/ui/forms";

interface SessionHeaderProps {
  title: string;
  isOpenDataSidebar: boolean;
  onSettingsClick: () => void;
  onDataSidebarClick: () => void;
}

export default function SessionHeader({
  title,
  isOpenDataSidebar,
  onSettingsClick,
  onDataSidebarClick,
}: SessionHeaderProps) {
  const navigate = useNavigate();

  {
    /* Mobile Header - only visible on mobile */
  }

  return (
    <>
      <header className="fixed top-0 z-10 flex h-10 w-full items-center justify-between px-4 backdrop-blur-md md:hidden">
        {/* Left: Back button */}
        <button
          onClick={() => navigate({ to: "/sessions" })}
          className="text-fg-default hover:text-fg-muted -ml-2 flex h-10 w-10 items-center justify-center transition-colors"
          aria-label="Go back to sessions list"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Center: Session title */}
        <h1 className="text-fg-default flex-1 truncate text-center text-base font-semibold">
          {title}
        </h1>

        {/* Right: Settings button */}
        <button
          onClick={onSettingsClick}
          className="text-fg-default hover:text-fg-muted -mr-2 flex h-10 w-10 items-center justify-center transition-colors"
          aria-label="Session settings"
        >
          <Pencil className="h-5 w-5" />
        </button>
      </header>

      <div className="absolute top-4 left-4 z-30 hidden flex-col items-start gap-4 md:flex">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/sessions" })}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface text-fg-default transition-colors hover:bg-surface-raised hover:text-fg-default"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-semibold text-fg-default">{title}</div>
        </div>

        <Button
          variant="secondary"
          onClick={onDataSidebarClick}
          icon={<ChartNoAxesColumnIncreasing className="h-5 w-5" />}
        >
          {isOpenDataSidebar && "Session data"}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSettingsClick}
        className="text-fg-muted hover:text-fg-default absolute top-4 right-4 z-30 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface transition-colors hover:bg-surface-raised md:flex"
        aria-label="Session settings"
      >
        <Pencil className="h-5 w-5" />
      </button>
    </>
  );
}
