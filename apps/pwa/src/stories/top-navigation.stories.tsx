import type { Meta, StoryObj } from "@storybook/react";
import { TopNavigation } from "@/components-v2/top-navigation";
import React from "react";
import { Button } from "@/shared/ui";
import { ArrowLeft, Search, MoreVertical, Filter, Share } from "lucide-react";

const meta = {
  title: "Components/TopNavigation",
  component: TopNavigation,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TopNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Page Title",
    onMenuClick: () => alert("Menu clicked!"),
  },
};

export const LongTitle: Story = {
  args: {
    title: "This is a very long title that should be truncated with ellipsis",
    onMenuClick: () => alert("Menu clicked!"),
  },
};

export const CustomLeftAction: Story = {
  args: {
    title: "Custom Actions",
    leftAction: (
      <Button size="icon" variant="ghost_white">
        <ArrowLeft className="w-5 h-5" />
      </Button>
    ),
  },
};

export const CustomRightAction: Story = {
  args: {
    title: "With Actions",
    onMenuClick: () => alert("Menu clicked!"),
    rightAction: (
      <Button size="icon" variant="ghost_white">
        <Search className="w-5 h-5" />
      </Button>
    ),
  },
};

export const BothCustomActions: Story = {
  args: {
    title: "Full Custom",
    leftAction: (
      <Button size="icon" variant="ghost_white">
        <ArrowLeft className="w-5 h-5" />
      </Button>
    ),
    rightAction: (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost_white">
          <Search className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost_white">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    ),
  },
};

export const Transparent: Story = {
  args: {
    title: "Transparent Nav",
    transparent: true,
    transparencyLevel: 50,
    onMenuClick: () => alert("Menu clicked!"),
  },
  decorators: [
    (Story) => (
      <div
        className="h-screen"
        style={{
          backgroundImage: "linear-gradient(to bottom right, #3b82f6, #8b5cf6)",
        }}
      >
        <Story />
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Transparent Navigation Demo
          </h2>
          <p className="text-white/80">
            The navigation bar has 50% transparency with backdrop blur.
          </p>
        </div>
      </div>
    ),
  ],
};

export const FullyTransparent: Story = {
  args: {
    title: "Fully Transparent",
    transparent: true,
    transparencyLevel: 100,
    onMenuClick: () => alert("Menu clicked!"),
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-gradient-to-br from-purple-600 to-pink-600">
        <Story />
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white">
            100% Transparent Navigation
          </h2>
        </div>
      </div>
    ),
  ],
};

export const CustomClassName: Story = {
  args: {
    title: "Custom Styled",
    className: "bg-primary border-b-2 border-primary-foreground",
    titleClassName: "text-primary-foreground font-bold",
    onMenuClick: () => alert("Menu clicked!"),
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  args: {
    title: "Mobile Navigation",
    onMenuClick: () => alert("Menu clicked!"),
    rightAction: (
      <Button size="icon" variant="ghost_white">
        <Filter className="w-5 h-5" />
      </Button>
    ),
  },
};

export const InteractiveExample: Story = {
  args: {
    title: "Dashboard",
  },
  render: () => {
    const [title, setTitle] = React.useState("Dashboard");
    const [transparency, setTransparency] = React.useState(0);
    const [showBack, setShowBack] = React.useState(false);
    const [showActions, setShowActions] = React.useState(true);

    const pages = ["Dashboard", "Profile", "Settings", "Help & Support"];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <TopNavigation
          title={title}
          transparent={transparency > 0}
          transparencyLevel={transparency}
          leftAction={
            showBack ? (
              <Button
                size="icon"
                variant="ghost_white"
                onClick={() => setShowBack(false)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : undefined
          }
          rightAction={
            showActions ? (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost_white">
                  <Search className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost_white">
                  <Share className="w-5 h-5" />
                </Button>
              </div>
            ) : undefined
          }
          onMenuClick={showBack ? undefined : () => alert("Menu clicked!")}
        />
        
        <div className="p-8 max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-4">Navigation Controls</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Page Title</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {pages.map((page) => (
                    <option key={page} value={page}>{page}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">
                  Transparency: {transparency}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showBack}
                    onChange={(e) => setShowBack(e.target.checked)}
                  />
                  <span className="text-sm">Show Back Button</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showActions}
                    onChange={(e) => setShowActions(e.target.checked)}
                  />
                  <span className="text-sm">Show Action Buttons</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-muted-foreground">
              This is the page content below the navigation bar.
              Adjust the controls above to see how the navigation changes.
            </p>
          </div>
        </div>
      </div>
    );
  },
};

export const SafeAreaDemo: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  args: {
    title: "Safe Area Support",
    onMenuClick: () => alert("Menu clicked!"),
  },
  render: () => (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-black pt-[44px] pb-2 text-white text-xs text-center">
        Simulated iPhone Notch Area
      </div>
      <TopNavigation
        title="Safe Area Support"
        onMenuClick={() => alert("Menu clicked!")}
      />
      <div className="p-4">
        <p className="text-sm">
          The navigation bar includes safe area padding to account for
          device notches and system UI elements on mobile devices.
        </p>
      </div>
    </div>
  ),
};

export const NavigationFlow: Story = {
  args: {
    title: "Home",
  },
  render: () => {
    const [currentPage, setCurrentPage] = React.useState(0);
    const pages = [
      { title: "Home", hasBack: false },
      { title: "Categories", hasBack: true },
      { title: "Products", hasBack: true },
      { title: "Product Details", hasBack: true },
    ];

    const navigate = (direction: number) => {
      const newPage = currentPage + direction;
      if (newPage >= 0 && newPage < pages.length) {
        setCurrentPage(newPage);
      }
    };

    return (
      <div className="h-screen bg-gray-50">
        <TopNavigation
          title={pages[currentPage].title}
          leftAction={
            pages[currentPage].hasBack ? (
              <Button
                size="icon"
                variant="ghost_white"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : undefined
          }
          onMenuClick={!pages[currentPage].hasBack ? () => alert("Menu") : undefined}
        />
        
        <div className="p-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
              <h2 className="text-xl font-semibold mb-2">
                {pages[currentPage].title}
              </h2>
              <p className="text-muted-foreground mb-4">
                Page {currentPage + 1} of {pages.length}
              </p>
            </div>
            
            {currentPage < pages.length - 1 && (
              <button
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded"
                onClick={() => navigate(1)}
              >
                Go to {pages[currentPage + 1].title}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
};