import type { Meta, StoryObj } from "@storybook/react";
import { ButtonPill } from "@/components-v2/ui/button-pill";
import { useState } from "react";

const meta = {
  title: "Components/ButtonPill",
  component: ButtonPill,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ButtonPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Panel Button",
  },
};

export const Active: Story = {
  args: {
    children: "Active Panel",
    active: true,
  },
};


export const PanelFocusBehavior: Story = {
  render: () => {
    const [activePanel, setActivePanel] = useState<string | null>(null);
    
    const panels = ["Prompt", "Parameters", "Output", "Preview"];
    
    return (
      <div className="flex gap-2">
        {panels.map((panel) => (
          <ButtonPill
            key={panel}
            active={activePanel === panel}
            onClick={() => setActivePanel(panel)}
          >
            {panel}
          </ButtonPill>
        ))}
        <div className="ml-4 text-sm text-muted-foreground">
          Active: {activePanel || "None"}
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <ButtonPill>Default</ButtonPill>
        <span className="text-xs text-muted-foreground">Normal state</span>
      </div>
      <div className="flex gap-2 items-center">
        <ButtonPill active>Active</ButtonPill>
        <span className="text-xs text-muted-foreground">Panel is open/focused</span>
      </div>
    </div>
  ),
};