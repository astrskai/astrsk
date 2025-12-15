import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMobileNavigationStore } from "@/shared/stores/mobile-navigation-context";

interface SessionHeaderProps {
  title: string;
  onSettingsClick: () => void;
}

export default function SessionHeader({
  title,
  onSettingsClick,
}: SessionHeaderProps) {
  const navigate = useNavigate();
  const setMobileMenuOpen = useMobileNavigationStore.use.setIsOpen();

  {
    /* Mobile Header - only visible on mobile */
  }

  return (
    <>
      <header className="fixed top-0 z-10 flex h-10 w-full items-center justify-between px-4 backdrop-blur-md md:hidden">
        {/* Left: Back button */}
        <button
          onClick={() => {
            setMobileMenuOpen(true);
            navigate({ to: "/sessions" });
          }}
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

      {/* Desktop: No back button or title - sidebar has its own collapse toggle */}

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
