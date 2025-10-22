import type { Meta, StoryObj } from "@storybook/react";
import { TradingCardDisplay } from "@/features/card/components/trading-card-display";
import { Card, CardType } from "@/modules/card/domain";
import { UniqueEntityID } from "@/shared/domain";

/**
 * Trading Card Component
 * 
 * Displays character and plot cards with various states including empty states.
 * 
 * Figma Design References:
 * - Character Card Empty State: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-374075&m=dev
 * - Plot Card Empty State: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-374076&m=dev
 */

// Helper function to create character card
const createCharacterCard = (overrides: any = {}): Card => {
  const defaultProps = {
    id: new UniqueEntityID(),
    type: CardType.Character,
    title: "",
    name: "",
    tags: [],
    tokenCount: 0,
    iconAssetId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return {
    props: { ...defaultProps, ...overrides },
  } as Card;
};

// Helper function to create plot card
const createPlotCard = (overrides: any = {}): Card => {
  const defaultProps = {
    id: new UniqueEntityID(),
    type: CardType.Plot,
    title: "",
    tags: [],
    tokenCount: 0,
    iconAssetId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return {
    props: { ...defaultProps, ...overrides },
  } as Card;
};

const meta = {
  title: "Figma/TradingCard",
  component: TradingCardDisplay,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0a0a0a" },
        { name: "light", value: "#ffffff" },
      ],
    },
    docs: {
      description: {
        component: `Trading card component for displaying character and plot cards.
        
**Figma Design References:**
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-374075&m=dev" target="_blank" rel="noopener noreferrer">Character Card Empty State</a>
- <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-374076&m=dev" target="_blank" rel="noopener noreferrer">Plot Card Empty State</a>`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    card: {
      control: { type: "object" },
      description: "Card data object",
    },
    imageUrl: {
      control: { type: "text" },
      description: "URL for the card image",
    },
    isLoading: {
      control: { type: "boolean" },
      description: "Loading state",
    },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof TradingCardDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Figma: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-374075&m=dev
export const CharacterCardEmptyState: Story = {
  args: {
    card: createCharacterCard({
      title: "",
      name: "",
      tags: [],
      tokenCount: 0,
    }),
    imageUrl: null,
  },
};

// Figma: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-374076&m=dev
export const PlotCardEmptyState: Story = {
  args: {
    card: createPlotCard({
      title: "",
      tags: [],
      tokenCount: 0,
    }),
    imageUrl: null,
  },
};

export const CharacterCard: Story = {
  args: {
    card: createCharacterCard({
      title: "Elena Starweaver",
      name: "Elena Starweaver",
      tags: ["Mage", "Protagonist", "Scholar"],
      tokenCount: 2456,
    }),
    imageUrl: null,
  },
};

export const PlotCard: Story = {
  args: {
    card: createPlotCard({
      title: "The Lost Crystal",
      tags: ["Fantasy", "Adventure"],
      tokenCount: 1823,
    }),
    imageUrl: null,
  },
};

export const CharacterCardWithCustomImage: Story = {
  args: {
    card: createCharacterCard({
      title: "Marcus Shadowbane",
      name: "Marcus Shadowbane",
      tags: ["Warrior", "Leader"],
      tokenCount: 3102,
    }),
    imageUrl: "https://picsum.photos/164/289?random=1",
  },
};

export const CharacterCardNoTags: Story = {
  args: {
    card: createCharacterCard({
      title: "Silent Guardian",
      name: "Silent Guardian",
      tags: [],
      tokenCount: 1543,
    }),
    imageUrl: null,
  },
};

export const CharacterCardLongName: Story = {
  args: {
    card: createCharacterCard({
      title: "Alexander Constantine Maximilian von Rothschild III",
      name: "Alexander Constantine Maximilian von Rothschild III",
      tags: ["Aristocrat", "Diplomat"],
      tokenCount: 3217,
    }),
    imageUrl: null,
  },
};

export const CharacterCardManyTags: Story = {
  args: {
    card: createCharacterCard({
      title: "Aria Moonwhisper",
      name: "Aria Moonwhisper",
      tags: [
        "Elf",
        "Ranger",
        "Forest Guardian",
        "Ancient Bloodline",
        "Master Archer",
        "Tracker",
        "Healer",
        "Mystic",
      ],
      tokenCount: 2891,
    }),
    imageUrl: null,
  },
};

export const LoadingState: Story = {
  args: {
    card: null,
    isLoading: true,
  },
};

export const InteractiveCard: Story = {
  args: {
    card: createCharacterCard({
      title: "Click Me!",
      name: "Interactive Character",
      tags: ["Clickable", "Demo"],
      tokenCount: 999,
    }),
    onClick: () => alert("Card clicked!"),
  },
};

export const MultipleCards: Story = {
  args: {
    card: createCharacterCard({
      title: "Default Card",
      name: "Default Card",
      tags: ["Example"],
      tokenCount: 100,
    }),
  },
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8">
      <TradingCardDisplay 
        card={createCharacterCard({
          title: "Elena Starweaver",
          name: "Elena Starweaver",
          tags: ["Mage", "Protagonist"],
          tokenCount: 2456,
        })}
        onClick={() => console.log("Character card clicked")}
      />
      <TradingCardDisplay 
        card={createPlotCard({
          title: "The Lost Crystal",
          tags: ["Fantasy", "Adventure"],
          tokenCount: 1823,
        })}
        onClick={() => console.log("Plot card clicked")}
      />
      <TradingCardDisplay 
        card={createCharacterCard({
          title: "",
          name: "",
          tags: [],
          tokenCount: 0,
        })}
        onClick={() => console.log("Empty character card clicked")}
      />
      <TradingCardDisplay 
        card={createPlotCard({
          title: "",
          tags: [],
          tokenCount: 0,
        })}
        onClick={() => console.log("Empty plot card clicked")}
      />
    </div>
  ),
};