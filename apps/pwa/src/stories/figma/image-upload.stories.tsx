import type { Meta, StoryObj } from "@storybook/react";
import { ImageUpload } from "@/features/card/components/edit-sheet/image-upload";
import { CardType } from "@/modules/card/domain";
import { useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * Image Upload Component
 * 
 * Figma Design Reference:
 * https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-234908&m=dev
 */
const meta = {
  title: "Figma/ImageUpload",
  component: ImageUpload,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Image upload component used in mobile card creation flow.
        
**Figma Design:** <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-234908&m=dev" target="_blank" rel="noopener noreferrer">View in Figma</a>`,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: Object.values(CardType),
      description: "Card type (Character or Plot)",
    },
    title: {
      control: "text",
      description: "Image alt text/title",
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-[200px] h-[200px]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof ImageUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

// Figma: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-234908&m=dev
export const CharacterCard: Story = {
  args: {
    type: CardType.Character,
    title: "Character Image",
  },
};

export const PlotCard: Story = {
  args: {
    type: CardType.Plot,
    title: "Plot Image",
  },
};

export const MobileSize: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-[375px] h-[200px]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    type: CardType.Character,
    title: "Mobile Upload",
  },
};

export const WithFormIntegration: Story = {
  args: {
    type: CardType.Character,
    title: "Form Integrated",
  },
  render: (args) => {
    const Component = () => {
      const { register, watch } = useForm<{ newIcon: FileList }>();
      const newIcon = watch("newIcon");

      return (
        <ImageUpload
          {...args}
          newIcon={newIcon}
          newIconProps={register("newIcon")}
        />
      );
    };
    return <Component />;
  },
};

export const Small: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-[150px] h-[150px]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    type: CardType.Character,
    title: "Small Image",
  },
};

export const Large: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-[400px] h-[300px]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    type: CardType.Plot,
    title: "Large Banner",
  },
};