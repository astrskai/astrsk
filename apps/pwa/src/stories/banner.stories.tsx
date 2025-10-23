import type { Meta, StoryObj } from "@storybook/react";
import { Banner, showBanner } from "@/components-v2/banner";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/components-v2/ui/sonner";

const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <div className="min-w-[400px]">
          <Story />
        </div>
        <Toaster position="top-center" />
      </>
    ),
  ],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Important Notice",
    description: "This is a banner message to grab user attention.",
  },
};

export const WithAction: Story = {
  args: {
    title: "Action Required",
    description: "Please complete your profile to continue.",
    actionLabel: "Complete Profile",
    onAction: () => alert("Action clicked!"),
  },
};

export const WithDismiss: Story = {
  args: {
    title: "Dismissible Banner",
    description: "You can dismiss this banner.",
    onDismiss: () => alert("Banner dismissed!"),
  },
};

export const WithBothButtons: Story = {
  args: {
    title: "Update Available",
    description: "A new version is available. Update now?",
    actionLabel: "Update",
    onAction: () => alert("Updating..."),
    onDismiss: () => alert("Dismissed"),
  },
};

export const TitleOnly: Story = {
  args: {
    title: "This is a title-only banner",
  },
};

export const DescriptionOnly: Story = {
  args: {
    description: "This banner only has a description without a title.",
  },
};

export const LongContent: Story = {
  args: {
    title: "Long Content Example",
    description: "This is a very long description that might wrap to multiple lines depending on the container width. It demonstrates how the banner handles longer content gracefully.",
    actionLabel: "Got it",
    onAction: () => alert("Acknowledged"),
  },
};

export const CustomContent: Story = {
  args: {
    title: (
      <span className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        Custom Title with Emoji
      </span>
    ),
    description: (
      <span>
        Custom description with <strong>bold text</strong> and{" "}
        <span className="underline">underlined text</span>.
      </span>
    ),
    onDismiss: () => alert("Dismissed"),
  },
};

export const ToastBanner: Story = {
  render: () => (
    <div className="space-y-4">
      <Button
        onClick={() => {
          showBanner({
            title: "Toast Banner",
            description: "This banner appears as a toast notification.",
            actionLabel: "Undo",
            onAction: () => alert("Undo clicked!"),
          });
        }}
      >
        Show Toast Banner
      </Button>
      
      <Button
        variant="outline"
        onClick={() => {
          showBanner({
            title: "Error Occurred",
            description: "Something went wrong. Please try again.",
          });
        }}
      >
        Show Error Banner
      </Button>
      
      <Button
        variant="outline"
        onClick={() => {
          const id = showBanner({
            title: "Processing...",
            description: "Your request is being processed.",
          });
          
          // Auto dismiss after 3 seconds
          setTimeout(() => {
            // Note: In real implementation, you'd use toast.dismiss(id)
            alert("Process completed!");
          }, 3000);
        }}
      >
        Show Temporary Banner
      </Button>
    </div>
  ),
};

export const MultipleBanners: Story = {
  render: () => (
    <div className="space-y-4">
      <Banner
        title="First Banner"
        description="This is the first banner in a stack."
        onDismiss={() => {}}
      />
      <Banner
        title="Second Banner"
        description="Multiple banners can be displayed together."
        actionLabel="Learn More"
        onAction={() => alert("Learning more...")}
      />
      <Banner
        title="Third Banner"
        description="Each banner maintains its own state and actions."
        actionLabel="Fix Now"
        onAction={() => alert("Fixing...")}
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const ErrorStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Banner
        title="Network Error"
        description="Unable to connect to the server. Please check your connection."
        actionLabel="Retry"
        onAction={() => alert("Retrying...")}
        onDismiss={() => {}}
      />
      <Banner
        title="Validation Error"
        description="Please fix the errors below before continuing."
        onDismiss={() => {}}
      />
      <Banner
        title="Permission Denied"
        description="You don't have permission to perform this action."
        actionLabel="Request Access"
        onAction={() => alert("Requesting access...")}
      />
    </div>
  ),
};

export const SystemNotifications: Story = {
  render: () => (
    <div className="space-y-4">
      <Banner
        title="Scheduled Maintenance"
        description="System will be offline from 2 AM to 4 AM EST."
        actionLabel="View Details"
        onAction={() => alert("Viewing details...")}
        onDismiss={() => {}}
      />
      <Banner
        title="New Features Available"
        description="Check out the latest updates to improve your workflow."
        actionLabel="What's New"
        onAction={() => alert("Showing new features...")}
      />
      <Banner
        title="Trial Ending Soon"
        description="Your trial expires in 3 days. Upgrade to continue."
        actionLabel="Upgrade Now"
        onAction={() => alert("Opening upgrade page...")}
        onDismiss={() => {}}
      />
    </div>
  ),
};