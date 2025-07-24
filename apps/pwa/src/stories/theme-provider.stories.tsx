import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider, useTheme } from "@/components-v2/theme-provider";
import React from "react";
import { Button } from "@/components-v2/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

const meta = {
  title: "Components/ThemeProvider",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ThemeDemo = () => {
  const { mode, setMode, theme } = useTheme();

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Theme Provider Demo</h1>
          <p className="text-muted-foreground">
            Current mode: <span className="font-semibold">{mode}</span> (Theme: {theme})
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant={mode === "light" ? "default" : "outline"}
            onClick={() => setMode("light")}
          >
            <Sun className="w-4 h-4 mr-2" />
            Light
          </Button>
          <Button
            variant={mode === "dark" ? "default" : "outline"}
            onClick={() => setMode("dark")}
          >
            <Moon className="w-4 h-4 mr-2" />
            Dark
          </Button>
          <Button
            variant={mode === "system" ? "default" : "outline"}
            onClick={() => setMode("system")}
          >
            <Monitor className="w-4 h-4 mr-2" />
            System
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-background border rounded-lg">
            <h3 className="font-semibold mb-2">Background Colors</h3>
            <div className="space-y-2">
              <div className="p-3 bg-background rounded">Default</div>
              <div className="p-3 bg-muted rounded">Muted</div>
              <div className="p-3 bg-card rounded">Card</div>
            </div>
          </div>

          <div className="p-6 bg-background border rounded-lg">
            <h3 className="font-semibold mb-2">Text Colors</h3>
            <div className="space-y-2">
              <p className="text-foreground">Foreground</p>
              <p className="text-muted-foreground">Muted Foreground</p>
              <p className="text-primary">Primary</p>
              <p className="text-destructive">Destructive</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {},
  render: () => (
    <ThemeProvider defaultMode="light">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const DarkDefault: Story = {
  args: {},
  render: () => (
    <ThemeProvider defaultMode="dark">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const SystemDefault: Story = {
  args: {},
  render: () => (
    <ThemeProvider defaultMode="system">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const ComponentShowcase: Story = {
  args: {},
  render: () => {
    const ShowcaseContent = () => {
      const { mode, setMode } = useTheme();

      return (
        <div className="p-8 min-h-screen">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Component Showcase</h1>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "light" | "dark" | "system")}
                className="px-4 py-2 border rounded-md bg-background"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-card border rounded-lg">
                <h3 className="font-semibold mb-4">Card Example</h3>
                <p className="text-muted-foreground mb-4">
                  This is a card component that adapts to the current theme.
                </p>
                <Button className="w-full">Action</Button>
              </div>

              <div className="p-6 bg-muted rounded-lg">
                <h3 className="font-semibold mb-4">Muted Background</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-background rounded">Nested Background</div>
                  <div className="p-2 bg-card rounded">Nested Card</div>
                </div>
              </div>

              <div className="p-6 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold mb-4">Border Styles</h3>
                <div className="space-y-2">
                  <div className="p-2 border rounded">Default Border</div>
                  <div className="p-2 border-primary border rounded">Primary Border</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border rounded-lg">
              <h3 className="font-semibold mb-4">Form Elements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Input Field</label>
                  <input
                    type="text"
                    placeholder="Type something..."
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Field</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-primary text-primary-foreground rounded-lg">
                <h3 className="font-semibold mb-2">Primary Section</h3>
                <p>Content with primary background color</p>
              </div>
              <div className="p-6 bg-destructive text-destructive-foreground rounded-lg">
                <h3 className="font-semibold mb-2">Destructive Section</h3>
                <p>Content with destructive background color</p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <ThemeProvider>
        <ShowcaseContent />
      </ThemeProvider>
    );
  },
};

export const PersistentTheme: Story = {
  args: {},
  render: () => {
    const PersistentDemo = () => {
      const { mode, setMode, theme } = useTheme();
      const [history, setHistory] = React.useState<string[]>([]);

      const handleModeChange = (newMode: "light" | "dark" | "system") => {
        setMode(newMode);
        setHistory(prev => [...prev, `Changed to ${newMode} at ${new Date().toLocaleTimeString()}`]);
      };

      return (
        <div className="p-8 min-h-screen">
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Persistent Theme Storage</h1>
            <p className="text-muted-foreground">
              The theme selection is stored in localStorage and persists across page reloads.
            </p>

            <div className="flex gap-2">
              <Button onClick={() => handleModeChange("light")}>Light</Button>
              <Button onClick={() => handleModeChange("dark")}>Dark</Button>
              <Button onClick={() => handleModeChange("system")}>System</Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-2">localStorage Value:</p>
              <code className="text-sm">theme-mode: {mode}</code>
              <br />
              <code className="text-sm">Current theme: {theme}</code>
            </div>

            {history.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Theme Change History:</h3>
                <ul className="space-y-1 text-sm">
                  {history.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <ThemeProvider>
        <PersistentDemo />
      </ThemeProvider>
    );
  },
};