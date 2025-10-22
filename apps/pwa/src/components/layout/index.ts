// Layout Components Barrel Export
// Auto-generated on 2025-10-22

// Both Sidebar (shadcn/ui extended component with Left/Right support)
export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarLeft,
  SidebarLeftMenuButton,
  SidebarLeftProvider,
  SidebarLeftRail,
  SidebarLeftTrigger,
  MobileSidebarLeftTrigger,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRight,
  SidebarRightMenuButton,
  SidebarRightProvider,
  SidebarRightRail,
  SidebarRightTrigger,
  SidebarSeparator,
  useSidebarLeft,
  useSidebarRight,
} from "./both-sidebar";

// Dockview Components
export { default as DockviewDefaultTab } from "./dockview-default-tab";
export { default as DockviewHiddenTab } from "./dockview-hidden-tab"; // [CLEANUP-TODO] UNUSED
export {
  usePanelFocusAnimation,
  PanelFocusAnimationWrapper,
} from "./dockview-panel-focus-animation";

// Mobile Navigation
export { LeftNavigationMobile, MobileNavItem } from "./left-navigation-mobile"; // Phase 3: Merge with LeftNavigation

// Top Navigation Components
export { TopBar } from "./top-bar";
export { TopNavigation } from "./top-navigation";

// Desktop left-navigation remains in components-v2/left-navigation/ folder
// Phase 3 TODO: Merge LeftNavigation and LeftNavigationMobile using Tailwind responsive design
