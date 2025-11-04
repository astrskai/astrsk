import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet";
import { FolderOpen, Settings, LogIn } from "lucide-react";
import { IconSessions } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MenuItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const MENU_ITEMS: Omit<MenuItemProps, "onClick">[] = [
  {
    to: "/sessions",
    icon: <IconSessions className="h-5 w-5" />,
    label: "Sessions",
  },
  {
    to: "/assets/characters",
    icon: <FolderOpen size={20} />,
    label: "Assets",
  },
  {
    to: "/settings",
    icon: <Settings size={20} />,
    label: "Settings",
  },
  // {
  //   to: "/login",
  //   icon: <LogIn size={20} />,
  //   label: "Log in",
  // },
];

function MenuItem({ to, icon, label, onClick }: MenuItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
        "text-text-primary hover:bg-background-surface-3",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      <span className="text-text-secondary">{icon}</span>
      <span className="text-base font-medium">{label}</span>
    </Link>
  );
}

/**
 * Mobile menu drawer - slides in from left
 * Shows navigation menu for mobile devices
 */
export function MobileMenuDrawer({
  open,
  onOpenChange,
}: MobileMenuDrawerProps) {
  const handleMenuItemClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="bg-background-surface-2 flex w-[280px] flex-col p-0"
      >
        <SheetHeader className="border-border border-b px-4 py-4">
          <SheetTitle className="text-text-primary text-left text-lg font-semibold">
            Menu
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-0">
          {MENU_ITEMS.map((item) => (
            <MenuItem key={item.to} {...item} onClick={handleMenuItemClick} />
          ))}
        </nav>

        {/* Version Info */}
        <div className="border-border border-t px-4 py-3">
          <p className="text-text-tertiary text-xs">Version {__APP_VERSION__}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
