import type { Meta, StoryObj } from "@storybook/react";
import { Loading } from "@/components-v2/loading";

const meta = {
  title: "Components/Loading",
  component: Loading,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isTimer: false,
  },
};

export const WithTimer: Story = {
  args: {
    isTimer: true,
  },
};

export const InContainer: Story = {
  args: {
    isTimer: true,
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-background-surface-0">
        <div className="h-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const MobileView: Story = {
  args: {
    isTimer: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const ComparisonView: Story = {
  render: () => (
    <div className="grid grid-cols-2 h-screen">
      <div className="border-r">
        <h3 className="p-4 font-semibold">Without Timer</h3>
        <div className="h-[calc(100%-60px)]">
          <Loading isTimer={false} />
        </div>
      </div>
      <div>
        <h3 className="p-4 font-semibold">With Timer</h3>
        <div className="h-[calc(100%-60px)]">
          <Loading isTimer={true} />
        </div>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  args: {
    isTimer: true,
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-gray-900 dark">
        <Story />
      </div>
    ),
  ],
};

export const CustomBackground: Story = {
  args: {
    isTimer: true,
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Story />
      </div>
    ),
  ],
};