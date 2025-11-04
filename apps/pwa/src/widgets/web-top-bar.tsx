import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/shared/ui/forms";
import { SvgIcon } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { MobileMenuDrawer } from "@/widgets/mobile-menu-drawer";

/**
 * Web TopBar - Mobile navigation header for web/PWA environment
 * Shows hamburger menu button and app logo
 * Desktop: Hidden (uses FixedNav instead)
 * Mobile: Shows menu button to open MobileMenuDrawer
 */
export function WebTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <MobileMenuDrawer open={isMenuOpen} onOpenChange={setIsMenuOpen} />

      <div
        className={cn(
          "bg-background-surface-2 border-border z-30 border-b",
          "flex items-center justify-between px-4 py-3",
          "md:hidden", // Hide on desktop (FixedNav is used instead)
        )}
      >
        {/* Left: Menu Button */}
        <Button
          variant="ghost"
          icon={<Menu size={24} />}
          size="sm"
          aria-label="Menu"
          onClick={() => setIsMenuOpen(true)}
          className="text-text-primary"
        />

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <SvgIcon name="astrsk_logo_full" width={100} height={24} />
        </div>

        {/* Right: Placeholder for balance */}
        <div className="w-10" />
      </div>
    </>
  );
}
