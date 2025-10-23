import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardText } from "@/components-v2/card";
import { MoreVertical, Edit, Trash, Copy, Star } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useState } from "react";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <CardText label="Name">John Doe</CardText>
        <CardText label="Email">john.doe@example.com</CardText>
      </div>
    ),
  },
};

export const WithButtons: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <CardText label="Project Name">My Awesome Project</CardText>
        <CardText label="Status">In Progress</CardText>
      </div>
    ),
    buttons: (
      <>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </>
    ),
  },
};

export const ActiveState: Story = {
  args: {
    active: true,
    children: (
      <div className="space-y-4">
        <CardText label="Selected Item">This card is currently active</CardText>
        <CardText label="Description">It has a primary color border</CardText>
      </div>
    ),
  },
};

export const ErrorState: Story = {
  args: {
    error: true,
    children: (
      <div className="space-y-4">
        <CardText label="Error Card">This card has an error</CardText>
        <CardText label="Message">Please fix the issues to continue</CardText>
      </div>
    ),
  },
};

export const ErrorStateNoIcon: Story = {
  args: {
    error: true,
    hideErrorIcon: true,
    children: (
      <div className="space-y-4">
        <CardText label="Error Card">Error without icon</CardText>
        <CardText label="Message">The error icon is hidden</CardText>
      </div>
    ),
  },
};

export const DisabledState: Story = {
  args: {
    disabled: true,
    children: (
      <div className="space-y-4">
        <CardText label="Disabled Card">This card is disabled</CardText>
        <CardText label="Status">Cannot be interacted with</CardText>
      </div>
    ),
    buttons: (
      <Button variant="ghost" size="icon" className="h-6 w-6">
        <Edit className="h-4 w-4" />
      </Button>
    ),
  },
};

export const Clickable: Story = {
  args: {
    onClick: () => alert("Card clicked!"),
    children: (
      <div className="space-y-4">
        <CardText label="Clickable Card">Click anywhere on this card</CardText>
        <CardText label="Action">Shows an alert when clicked</CardText>
      </div>
    ),
  },
};

export const MultilineText: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <CardText label="Title">Long Content Example</CardText>
        <CardText label="Description" multiline>
          This is a very long description that spans multiple lines. When multiline is set to true, 
          the text will wrap naturally and display all content without truncation. This is useful 
          for displaying detailed information within a card.
        </CardText>
      </div>
    ),
  },
};

export const CardTextVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <CardText label="With Label">Content with a label above</CardText>
          <CardText>Content without a label</CardText>
          <CardText label="Empty Content" />
        </div>
      </Card>
    </div>
  ),
};

export const ComplexCard: Story = {
  args: {
    children: (
      <div className="flex gap-4">
        <img
          src="https://via.placeholder.com/80"
          alt="Thumbnail"
          className="w-20 h-20 rounded"
        />
        <div className="flex-1 space-y-2">
          <CardText label="Product Name">Wireless Headphones Pro</CardText>
          <CardText label="Price">$299.99</CardText>
          <CardText label="In Stock">15 units</CardText>
        </div>
      </div>
    ),
    buttons: (
      <>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Star className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Trash className="h-4 w-4" />
        </Button>
      </>
    ),
  },
};

export const CardList: Story = {
  render: () => {
    const items = [
      { id: 1, name: "Item 1", status: "Active", active: true },
      { id: 2, name: "Item 2", status: "Pending", active: false },
      { id: 3, name: "Item 3", status: "Error", active: false, error: true },
      { id: 4, name: "Item 4", status: "Disabled", active: false, disabled: true },
    ];

    return (
      <div className="space-y-0">
        {items.map((item) => (
          <Card
            key={item.id}
            active={item.active}
            error={item.error}
            disabled={item.disabled}
            className="m-0 rounded-none border-b-0 last:border-b last:rounded-b-[8px] first:rounded-t-[8px]"
          >
            <div className="space-y-2">
              <CardText label="Name">{item.name}</CardText>
              <CardText label="Status">{item.status}</CardText>
            </div>
          </Card>
        ))}
      </div>
    );
  },
};

export const InteractiveStates: Story = {
  render: () => {
    const [activeId, setActiveId] = useState<number | null>(1);

    const cards = [
      { id: 1, title: "Card 1", description: "Click to select" },
      { id: 2, title: "Card 2", description: "Click to select" },
      { id: 3, title: "Card 3", description: "Click to select" },
    ];

    return (
      <div className="space-y-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            active={activeId === card.id}
            onClick={() => setActiveId(card.id)}
            className="cursor-pointer"
          >
            <div className="space-y-2">
              <CardText label="Title">{card.title}</CardText>
              <CardText label="Description">{card.description}</CardText>
            </div>
          </Card>
        ))}
      </div>
    );
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Content Card</h3>
          <span className="text-sm text-muted-foreground">2 hours ago</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This card demonstrates how to use completely custom content inside the Card component.
        </p>
        <div className="flex gap-2">
          <Button size="sm">Action 1</Button>
          <Button size="sm" variant="outline">Action 2</Button>
        </div>
      </div>
    ),
  },
};