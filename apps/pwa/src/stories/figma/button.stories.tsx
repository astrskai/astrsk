import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/shared/ui";

/**
 * Button Component
 * 
 * Figma Design Reference:
 * https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=27063-50757&m=dev
 */
const meta = {
  title: "Figma/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Button component for triggering actions and navigation.
        
**Figma Design:** <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=27063-50757&m=dev" target="_blank" rel="noopener noreferrer">View in Figma</a>`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "ghost_white", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-lg"],
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Figma: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=27063-50757&m=dev
export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Button",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Loading...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="flex gap-2">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
};