import type { Meta, StoryObj } from "@storybook/react";
import { InitialPage } from "@/components-v2/init-page";
import React from "react";

const meta = {
  title: "Components/InitialPage",
  component: InitialPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InitialPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const SimulatedLoading: Story = {
  render: () => {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }, []);

    return (
      <>
        {isVisible && <InitialPage />}
        {!isVisible && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">App Loaded!</h1>
              <p className="text-muted-foreground">The initial page was shown for 3 seconds</p>
            </div>
          </div>
        )}
      </>
    );
  },
};

export const WithAnimation: Story = {
  render: () => {
    const [opacity, setOpacity] = React.useState(1);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setOpacity((prev) => {
          const next = prev - 0.01;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 30);

      return () => clearInterval(interval);
    }, []);

    return (
      <div style={{ opacity }}>
        <InitialPage />
      </div>
    );
  },
};