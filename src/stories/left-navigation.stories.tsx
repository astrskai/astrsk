import type { Meta, StoryObj } from "@storybook/react";
import { LeftNavigationMobile, MobileNavItem, NavButton } from "@/components-v2/left-navigation";
import React from "react";
import { Home, User, Settings, Bell, Calendar, FileText, Folder, Star } from "lucide-react";
import { SvgIcon } from "@/components-v2/svg-icon";

const meta = {
  title: "Components/LeftNavigation",
  component: LeftNavigationMobile,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LeftNavigationMobile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-screen flex">
      <div className="w-64">
        <LeftNavigationMobile />
      </div>
      <div className="flex-1 p-8 bg-background">
        <h1 className="text-2xl font-bold">Main Content</h1>
        <p className="mt-2 text-muted-foreground">
          The left navigation is shown on the left side.
        </p>
      </div>
    </div>
  ),
};

export const WithCallback: Story = {
  render: () => {
    const [lastAction, setLastAction] = React.useState("");

    return (
      <div className="h-screen flex">
        <div className="w-64">
          <LeftNavigationMobile onNavigate={() => setLastAction("Navigation closed")} />
        </div>
        <div className="flex-1 p-8 bg-background">
          <h1 className="text-2xl font-bold">Navigation with Callback</h1>
          {lastAction && (
            <p className="mt-4 p-3 bg-muted rounded">
              Last action: {lastAction}
            </p>
          )}
        </div>
      </div>
    );
  },
};

export const NavButtonVariants: Story = {
  render: () => (
    <div className="p-8 bg-background-surface-2 space-y-4">
      <h3 className="font-semibold mb-4">NavButton Component Variants</h3>
      
      <div className="flex gap-4">
        <NavButton
          name="Default"
          icon={<Home className="w-6 h-6" />}
        />
        <NavButton
          name="Active"
          icon={<User className="w-6 h-6" />}
          active
          activeIcon={<User className="w-6 h-6 fill-current" />}
        />
        <NavButton
          name="With Badge"
          icon={<Bell className="w-6 h-6" />}
          badge={5}
        />
        <NavButton
          name="Ghost White"
          icon={<Settings className="w-6 h-6" />}
          variant="ghost_white"
        />
      </div>
    </div>
  ),
};

export const MobileNavItemVariants: Story = {
  render: () => (
    <div className="w-64 bg-background-surface-2 p-4 space-y-2">
      <h3 className="font-semibold mb-4">MobileNavItem Component Variants</h3>
      
      <MobileNavItem
        name="Default Item"
        icon={<Home className="w-5 h-5" />}
      />
      <MobileNavItem
        name="Active Item"
        icon={<User className="w-5 h-5" />}
        active
        activeIcon={<User className="w-5 h-5 fill-current" />}
      />
      <MobileNavItem
        name="With Badge"
        icon={<Bell className="w-5 h-5" />}
        badge={12}
      />
      <MobileNavItem
        name="Active with Badge"
        icon={<Calendar className="w-5 h-5" />}
        active
        badge={3}
      />
    </div>
  ),
};

export const InteractiveNavButtons: Story = {
  render: () => {
    const [activeButton, setActiveButton] = React.useState("home");
    
    const buttons = [
      { id: "home", name: "Home", icon: <Home className="w-6 h-6" /> },
      { id: "files", name: "Files", icon: <FileText className="w-6 h-6" /> },
      { id: "folders", name: "Folders", icon: <Folder className="w-6 h-6" /> },
      { id: "starred", name: "Starred", icon: <Star className="w-6 h-6" /> },
    ];

    return (
      <div className="p-8 bg-background-surface-2">
        <h3 className="font-semibold mb-4">Interactive Navigation Buttons</h3>
        <div className="flex gap-2">
          {buttons.map((button) => (
            <NavButton
              key={button.id}
              name={button.name}
              icon={button.icon}
              active={activeButton === button.id}
              onClick={() => setActiveButton(button.id)}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Active: {buttons.find(b => b.id === activeButton)?.name}
        </p>
      </div>
    );
  },
};

export const InteractiveMobileNav: Story = {
  render: () => {
    const [activeItem, setActiveItem] = React.useState("sessions");
    const [badges, setBadges] = React.useState({
      sessions: 2,
      notifications: 5,
    });

    const items = [
      { id: "sessions", name: "Sessions", icon: "sessions", activeIcon: "sessions_solid" },
      { id: "cards", name: "Cards", icon: "cards", activeIcon: "cards_solid" },
      { id: "agents", name: "Agents", icon: "agents", activeIcon: "agents_solid" },
      { id: "providers", name: "Providers", icon: "providers", activeIcon: "providers_solid" },
    ];

    return (
      <div className="flex h-screen">
        <div className="w-64 bg-background-surface-2 flex flex-col">
          <div className="flex items-center px-3.5 py-6 border-b border-border-dark">
            <h2 className="text-lg font-semibold text-white">Interactive Nav</h2>
          </div>
          
          <div className="flex flex-col py-6 space-y-2">
            {items.map((item) => (
              <MobileNavItem
                key={item.id}
                name={item.name}
                icon={<SvgIcon name={item.icon as any} />}
                active={activeItem === item.id}
                activeIcon={<SvgIcon name={item.activeIcon as any} />}
                badge={badges[item.id as keyof typeof badges]}
                onClick={() => setActiveItem(item.id)}
              />
            ))}
          </div>
          
          <div className="mt-auto p-4">
            <button
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded"
              onClick={() => setBadges(prev => ({
                ...prev,
                sessions: Math.floor(Math.random() * 10),
                notifications: Math.floor(Math.random() * 10),
              }))}
            >
              Randomize Badges
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">
            {items.find(i => i.id === activeItem)?.name} Page
          </h1>
          <p className="text-muted-foreground">
            Click navigation items to switch between pages.
          </p>
        </div>
      </div>
    );
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => (
    <div className="h-screen">
      <LeftNavigationMobile />
    </div>
  ),
};

export const CustomNavigation: Story = {
  render: () => (
    <nav className="w-64 h-screen bg-background-surface-2 flex flex-col">
      {/* Custom Header */}
      <div className="p-6 border-b border-border-dark">
        <h2 className="text-xl font-bold text-white">My App</h2>
        <p className="text-sm text-muted-foreground">v2.0.0</p>
      </div>
      
      {/* Primary Navigation */}
      <div className="flex-1 py-4">
        <div className="px-2 mb-2">
          <p className="text-xs uppercase text-muted-foreground px-4">Main</p>
        </div>
        <div className="space-y-1">
          <MobileNavItem
            name="Dashboard"
            icon={<Home className="w-5 h-5" />}
            active
          />
          <MobileNavItem
            name="Analytics"
            icon={<SvgIcon name="agents" />}
            badge={3}
          />
          <MobileNavItem
            name="Reports"
            icon={<FileText className="w-5 h-5" />}
          />
        </div>
        
        <div className="px-2 mb-2 mt-6">
          <p className="text-xs uppercase text-muted-foreground px-4">Support</p>
        </div>
        <div className="space-y-1">
          <MobileNavItem
            name="Help Center"
            icon={<SvgIcon name="providers" />}
          />
          <MobileNavItem
            name="Settings"
            icon={<Settings className="w-5 h-5" />}
          />
        </div>
      </div>
      
      {/* Custom Footer */}
      <div className="p-4 border-t border-border-dark">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full" />
          <div>
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
          </div>
        </div>
      </div>
    </nav>
  ),
};

export const WithNotifications: Story = {
  render: () => {
    const [notifications, setNotifications] = React.useState({
      messages: 5,
      alerts: 2,
      updates: 8,
    });

    return (
      <div className="flex gap-8 p-8 bg-background">
        <div className="space-y-4">
          <h3 className="font-semibold">Navigation with Dynamic Badges</h3>
          
          <div className="flex gap-2">
            <NavButton
              name="Messages"
              icon={<Bell className="w-6 h-6" />}
              badge={notifications.messages}
            />
            <NavButton
              name="Alerts"
              icon={<SvgIcon name="sessions" />}
              badge={notifications.alerts}
              active
            />
            <NavButton
              name="Updates"
              icon={<SvgIcon name="cards" />}
              badge={notifications.updates}
            />
          </div>
          
          <div className="space-y-2">
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
              onClick={() => setNotifications({
                messages: Math.floor(Math.random() * 20),
                alerts: Math.floor(Math.random() * 10),
                updates: Math.floor(Math.random() * 15),
              })}
            >
              Update Badges
            </button>
            <button
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
              onClick={() => setNotifications({ messages: 0, alerts: 0, updates: 0 })}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    );
  },
};