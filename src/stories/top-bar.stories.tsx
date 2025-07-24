import type { Meta, StoryObj } from "@storybook/react";
import { TopBar } from "@/components-v2/top-bar";
import { useSessionStore } from "@/app/stores/session-store";
import { useAppStore } from "@/app/stores/app-store";
import { UniqueEntityID } from "@/shared/domain";
import React from "react";

const meta = {
  title: "Components/TopBar",
  component: TopBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  render: () => {
    // Mock the loading state by overriding the store
    const originalIsLoading = useAppStore.getState().isLoading;
    
    React.useEffect(() => {
      useAppStore.setState({ isLoading: true });
      return () => {
        useAppStore.setState({ isLoading: originalIsLoading });
      };
    }, []);

    return <TopBar />;
  },
};

export const WithFlowName: Story = {
  render: () => {
    // Note: Flow names are managed through agent store, not flow store
    // This is a simplified example showing session context instead
    const selectSession = useSessionStore((state) => state.selectSession);
    
    React.useEffect(() => {
      selectSession(new UniqueEntityID(), "Example Flow Context");
      return () => selectSession(null, "");
    }, [selectSession]);

    return <TopBar />;
  },
};

export const WithSessionName: Story = {
  render: () => {
    const selectSession = useSessionStore((state) => state.selectSession);
    
    React.useEffect(() => {
      selectSession(new UniqueEntityID(), "Chat Session #42");
      return () => selectSession(null, "");
    }, [selectSession]);

    return <TopBar />;
  },
};

export const WindowsStyle: Story = {
  render: () => {
    // Simulate Windows platform
    const originalPlatform = window.navigator.platform;
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });

    React.useEffect(() => {
      return () => {
        Object.defineProperty(window.navigator, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      };
    }, [originalPlatform]);

    return <TopBar />;
  },
};

export const MacOSStyle: Story = {
  render: () => {
    // Simulate macOS platform
    const originalPlatform = window.navigator.platform;
    Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });

    React.useEffect(() => {
      return () => {
        Object.defineProperty(window.navigator, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      };
    }, [originalPlatform]);

    return <TopBar />;
  },
};

export const AllStates: Story = {
  render: () => {
    const [platform, setPlatform] = React.useState("Win32");
    const [pageName, setPageName] = React.useState("Sessions");
    const [contextName, setContextName] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const selectSession = useSessionStore((state) => state.selectSession);

    React.useEffect(() => {
      Object.defineProperty(window.navigator, 'platform', {
        value: platform,
        configurable: true,
      });
    }, [platform]);

    React.useEffect(() => {
      useAppStore.setState({ isLoading: loading });
    }, [loading]);

    const updateContext = (type: string) => {
      selectSession(null, "");
      
      switch(type) {
        case "flow":
          // For flow context, we'd need to update the agent store
          setContextName("Customer Support Flow");
          setPageName("Flows");
          break;
        case "session":
          selectSession(new UniqueEntityID(), "Morning Chat");
          setContextName("Morning Chat");
          setPageName("Sessions");
          break;
        default:
          setContextName("");
      }
    };

    return (
      <div className="space-y-4">
        <TopBar />
        
        <div className="p-4">
          <h3 className="font-semibold mb-4">Controls</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="Win32">Windows</option>
                <option value="MacIntel">macOS</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">Context</label>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 bg-primary text-primary-foreground rounded"
                  onClick={() => updateContext("flow")}
                >
                  Set Flow Context
                </button>
                <button
                  className="px-3 py-2 bg-primary text-primary-foreground rounded"
                  onClick={() => updateContext("session")}
                >
                  Set Session Context
                </button>
                <button
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded"
                  onClick={() => updateContext("none")}
                >
                  Clear Context
                </button>
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={loading}
                  onChange={(e) => setLoading(e.target.checked)}
                />
                <span className="text-sm font-medium">Loading State</span>
              </label>
            </div>
          </div>
          
          {contextName && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm">
                Current context: <strong>{contextName}</strong> ({pageName})
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
};

export const LongTitle: Story = {
  render: () => {
    const selectSession = useSessionStore((state) => state.selectSession);
    
    React.useEffect(() => {
      selectSession(new UniqueEntityID(), "This is a very long session name that should be truncated in the title bar to prevent overflow");
      return () => selectSession(null, "");
    }, [selectSession]);

    return <TopBar />;
  },
};

export const SimulatedElectron: Story = {
  render: () => {
    // Note: This is a simulation since we can't actually interact with Electron APIs in Storybook
    return (
      <div>
        <TopBar />
        <div className="p-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Electron Window Controls (Simulated)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              In a real Electron environment, the window control buttons would:
            </p>
            <ul className="space-y-1 text-sm list-disc list-inside">
              <li>New Window: Opens a new application window</li>
              <li>Minimize: Minimizes the window</li>
              <li>Maximize/Restore: Toggles between maximized and restored states</li>
              <li>Close: Closes the window (with unsaved changes check)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  },
};