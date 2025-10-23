import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ScenarioSelectionDialog, Scenario } from "@/features/session/components/scenario/scenario-selection-dialog";
import { ScenarioItem } from "@/features/session/components/scenario/scenario-item";
import { Button } from "@/components-v2/ui/button";

/**
 * Scenario Components
 * 
 * Figma Design Reference:
 * Desktop: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=27246-285851&m=dev
 */
const meta = {
  title: "Figma/Scenario",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Scenario components for selecting and displaying scenarios in dialog and item forms.
        
**Figma Design:** [Desktop View](https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=27246-285851&m=dev)`,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Scenario Selection Dialog Stories
export const SelectionDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedScenario, setSelectedScenario] = React.useState<Scenario | null>(null);
    
    const mockScenarios: Scenario[] = [
      {
        name: "Medieval Fantasy",
        description: "A classic fantasy setting with knights, dragons, and magic. Perfect for epic adventures.",
      },
      {
        name: "Space Opera",
        description: "Explore the vastness of space with alien civilizations and advanced technology.",
      },
      {
        name: "Cyberpunk City",
        description: "Navigate a dystopian future where technology and humanity collide in neon-lit streets.",
      },
      {
        name: "Victorian Mystery",
        description: "Solve crimes in gaslit London with steam-powered gadgets and intrigue.",
      },
    ];

    const handleSelectScenario = async (scenario: Scenario, index: number) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedScenario(scenario);
      console.log(`Selected scenario: ${scenario.name} at index ${index}`);
    };

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Scenario Selection</Button>
        
        {selectedScenario && (
          <div className="p-4 bg-background-surface-2 rounded-lg">
            <h3 className="font-semibold mb-2">Selected Scenario:</h3>
            <p className="text-sm">{selectedScenario.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{selectedScenario.description}</p>
          </div>
        )}
        
        <ScenarioSelectionDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          scenarios={mockScenarios}
          onSelectScenario={handleSelectScenario}
        />
      </div>
    );
  },
  name: "Scenario Selection Dialog",
};

export const SelectionDialogMobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedScenario, setSelectedScenario] = React.useState<Scenario | null>(null);
    
    const mockScenarios: Scenario[] = [
      {
        name: "Modern Day",
        description: "Contemporary setting with current technology and social dynamics.",
      },
      {
        name: "Post-Apocalyptic",
        description: "Survive in a world after civilization has collapsed.",
      },
      {
        name: "High School Drama",
        description: "Navigate the complex social world of teenage life.",
      },
    ];

    const handleSelectScenario = async (scenario: Scenario, index: number) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedScenario(scenario);
    };

    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Button onClick={() => setIsOpen(true)} className="w-full">
          Select Scenario
        </Button>
        
        {selectedScenario && (
          <div className="p-4 bg-background-surface-2 rounded-lg">
            <h3 className="font-semibold mb-2">Selected:</h3>
            <p className="text-sm">{selectedScenario.name}</p>
          </div>
        )}
        
        <ScenarioSelectionDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          scenarios={mockScenarios}
          onSelectScenario={handleSelectScenario}
        />
      </div>
    );
  },
  name: "Mobile: Scenario Selection Dialog",
};

// Scenario Item Stories
export const ScenarioItemDefault: Story = {
  render: () => (
    <div className="w-80 p-4 bg-background-surface-2 rounded-lg">
      <ScenarioItem
        name="Fantasy Adventure"
        contents="Embark on an epic quest in a world of magic and mystery. Face mythical creatures and uncover ancient secrets."
        onClick={() => console.log("Scenario clicked")}
      />
    </div>
  ),
  name: "Scenario Item: Default",
};

export const ScenarioItemActive: Story = {
  render: () => (
    <div className="w-80 p-4 bg-background-surface-2 rounded-lg">
      <ScenarioItem
        name="Space Exploration"
        contents="Journey through the cosmos, discovering new worlds and civilizations among the stars."
        active
        onClick={() => console.log("Active scenario clicked")}
      />
    </div>
  ),
  name: "Scenario Item: Active",
};

export const ScenarioItemList: Story = {
  render: () => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    
    const scenarios = [
      { name: "Urban Fantasy", contents: "Magic hidden in modern city life" },
      { name: "Time Travel", contents: "Jump between different eras of history" },
      { name: "Superhero Origin", contents: "Discover your newfound powers" },
      { name: "Mystery Mansion", contents: "Solve puzzles in a haunted estate" },
    ];

    return (
      <div className="w-80 p-4 bg-background-surface-2 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Select a Scenario</h3>
        {scenarios.map((scenario, index) => (
          <ScenarioItem
            key={index}
            name={scenario.name}
            contents={scenario.contents}
            active={activeIndex === index}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    );
  },
  name: "Scenario Item: Interactive List",
};

export const ScenarioItemMobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    
    const scenarios = [
      { name: "Detective Noir", contents: "Solve crimes in a gritty urban setting" },
      { name: "Pirate Adventure", contents: "Sail the seven seas seeking treasure" },
      { name: "Wild West", contents: "Live as an outlaw or sheriff in the frontier" },
    ];

    return (
      <div className="min-h-screen bg-background p-4">
        <h3 className="text-lg font-semibold mb-4">Choose Your Adventure</h3>
        <div className="space-y-3">
          {scenarios.map((scenario, index) => (
            <ScenarioItem
              key={index}
              name={scenario.name}
              contents={scenario.contents}
              active={activeIndex === index}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Note: Descriptions are hidden on mobile
        </p>
      </div>
    );
  },
  name: "Mobile: Scenario Items",
};