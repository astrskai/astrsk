import type { Meta, StoryObj } from "@storybook/react";
import { MobileUpdater } from "@/components-v2/mobile-updater";
import React from "react";

const meta = {
  title: "Components/MobileUpdater",
  component: MobileUpdater,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MobileUpdater>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UpdateAvailable: Story = {
  render: () => {
    // Since MobileUpdater uses internal state from useRegisterSW,
    // we can only show what it would look like in context
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">
          MobileUpdater component is rendered below. 
          In a real scenario, it would show an "Update" button when a service worker update is available.
        </p>
        <div className="border-t pt-4">
          <MobileUpdater />
        </div>
      </div>
    );
  },
};

export const InNavigationContext: Story = {
  render: () => {
    return (
      <div className="w-64 bg-background-surface-2 p-4 space-y-4">
        <h3 className="font-semibold">Navigation Menu</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 hover:bg-muted rounded">
            Dashboard
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-muted rounded">
            Settings
          </button>
          <MobileUpdater />
          <button className="w-full text-left px-4 py-2 hover:bg-muted rounded">
            Help
          </button>
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
  render: () => {
    return (
      <div className="w-full bg-background-surface-2 p-4">
        <h3 className="font-semibold mb-4">Mobile Navigation</h3>
        <div className="space-y-3">
          <MobileUpdater />
        </div>
      </div>
    );
  },
};

export const SimulatedStates: Story = {
  render: () => {
    const [showUpdate, setShowUpdate] = React.useState(false);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleUpdate = () => {
      setIsUpdating(true);
      setTimeout(() => {
        setIsUpdating(false);
        setShowUpdate(false);
        alert("App updated successfully! The page will reload.");
      }, 2000);
    };

    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Simulate Update States</h3>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => setShowUpdate(!showUpdate)}
          >
            {showUpdate ? "Hide" : "Show"} Update Available
          </button>
        </div>

        {showUpdate && (
          <div className="p-4 border-2 border-primary rounded-lg">
            <h4 className="font-medium mb-2">Update Available!</h4>
            <p className="text-sm text-muted-foreground mb-4">
              A new version of the app is available.
            </p>
            {/* Simulated update button similar to MobileNavItem */}
            <button
              className="w-full text-left px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded flex items-center gap-2"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              <span className="text-primary">
                {isUpdating ? "Updating..." : "Update"}
              </span>
            </button>
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            Note: This is a simulation. The actual MobileUpdater component 
            manages service worker updates internally.
          </p>
        </div>
      </div>
    );
  },
};