import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "@/components-v2/ui/sonner";
import { Button } from "@/components-v2/ui/button";
import { toast } from "sonner";
import React from "react";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() => toast("Event has been created")}
    >
      Show Toast
    </Button>
  ),
};

export const AllTypes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => toast("Default notification")}
        variant="outline"
      >
        Default
      </Button>
      <Button
        onClick={() => toast.success("Successfully saved!")}
        variant="outline"
      >
        Success
      </Button>
      <Button
        onClick={() => toast.error("Something went wrong")}
        variant="outline"
      >
        Error
      </Button>
      <Button
        onClick={() => toast.warning("Please check your input")}
        variant="outline"
      >
        Warning
      </Button>
      <Button
        onClick={() => toast.info("New update available")}
        variant="outline"
      >
        Info
      </Button>
    </div>
  ),
};

export const WithDescription: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() =>
        toast("Event created", {
          description: "Monday, October 3rd at 6:00pm",
        })
      }
    >
      Show Toast with Description
    </Button>
  ),
};

export const WithAction: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() =>
        toast("Event created", {
          action: {
            label: "Undo",
            onClick: () => console.log("Undo clicked"),
          },
        })
      }
    >
      Toast with Action
    </Button>
  ),
};

export const WithPromise: Story = {
  args: {},
  render: () => {
    const createPromise = () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const success = Math.random() > 0.3;
          if (success) {
            resolve({ name: "Async Task" });
          } else {
            reject(new Error("Failed to complete task"));
          }
        }, 2000);
      });

    return (
      <Button
        onClick={() =>
          toast.promise(createPromise(), {
            loading: "Loading...",
            success: "Task completed successfully!",
            error: "Error completing task",
          })
        }
      >
        Promise Toast
      </Button>
    );
  },
};

export const CustomDuration: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast("Quick notification", {
            duration: 1000,
          })
        }
        variant="outline"
      >
        1 Second
      </Button>
      <Button
        onClick={() =>
          toast("Standard notification", {
            duration: 4000,
          })
        }
        variant="outline"
      >
        4 Seconds
      </Button>
      <Button
        onClick={() =>
          toast("Long notification", {
            duration: 10000,
          })
        }
        variant="outline"
      >
        10 Seconds
      </Button>
      <Button
        onClick={() =>
          toast("Persistent notification", {
            duration: Infinity,
          })
        }
        variant="outline"
      >
        Infinite
      </Button>
    </div>
  ),
};

export const Positions: Story = {
  args: {},
  render: () => {
    const [position, setPosition] = React.useState<
      "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
    >("bottom-right");

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => setPosition("top-left")}
            variant={position === "top-left" ? "default" : "outline"}
            size="sm"
          >
            Top Left
          </Button>
          <Button
            onClick={() => setPosition("top-center")}
            variant={position === "top-center" ? "default" : "outline"}
            size="sm"
          >
            Top Center
          </Button>
          <Button
            onClick={() => setPosition("top-right")}
            variant={position === "top-right" ? "default" : "outline"}
            size="sm"
          >
            Top Right
          </Button>
          <Button
            onClick={() => setPosition("bottom-left")}
            variant={position === "bottom-left" ? "default" : "outline"}
            size="sm"
          >
            Bottom Left
          </Button>
          <Button
            onClick={() => setPosition("bottom-center")}
            variant={position === "bottom-center" ? "default" : "outline"}
            size="sm"
          >
            Bottom Center
          </Button>
          <Button
            onClick={() => setPosition("bottom-right")}
            variant={position === "bottom-right" ? "default" : "outline"}
            size="sm"
          >
            Bottom Right
          </Button>
        </div>
        <Button
          onClick={() => toast("Toast notification", { position })}
          className="w-full"
        >
          Show Toast at {position}
        </Button>
        <Toaster position={position} />
      </div>
    );
  },
};

export const WithCloseButton: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() =>
        toast("Dismissible notification", {
          duration: 10000,
          closeButton: true,
        })
      }
    >
      Toast with Close Button
    </Button>
  ),
};

export const RichContent: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() =>
        toast(
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              ✓
            </div>
            <div>
              <p className="font-semibold">Upload complete</p>
              <p className="text-sm text-muted-foreground">
                profile-picture.jpg uploaded successfully
              </p>
            </div>
          </div>
        )
      }
    >
      Rich Content Toast
    </Button>
  ),
};

export const Multiple: Story = {
  args: {},
  render: () => {
    let count = 0;

    return (
      <Button
        onClick={() => {
          count++;
          toast(`Notification ${count}`);
        }}
      >
        Add Multiple Toasts
      </Button>
    );
  },
};

export const UpdateToast: Story = {
  args: {},
  render: () => (
    <Button
      onClick={() => {
        const toastId = toast("Loading...", {
          duration: 10000,
        });

        setTimeout(() => {
          toast.success("Data loaded!", {
            id: toastId,
          });
        }, 2000);
      }}
    >
      Update Toast
    </Button>
  ),
};

export const CustomStyling: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast("Custom styled toast", {
            style: {
              background: "linear-gradient(to right, #4f46e5, #7c3aed)",
              color: "white",
              border: "none",
            },
          })
        }
        variant="outline"
      >
        Gradient Toast
      </Button>
      <Button
        onClick={() =>
          toast("Important notification", {
            className: "!bg-red-500 !text-white !border-red-600",
          })
        }
        variant="outline"
      >
        Red Toast
      </Button>
      <Button
        onClick={() =>
          toast("Minimal toast", {
            unstyled: true,
            className: "p-4 bg-white shadow-lg rounded-lg",
          })
        }
        variant="outline"
      >
        Unstyled Toast
      </Button>
    </div>
  ),
};

export const ComplexExample: Story = {
  args: {},
  render: () => {
    const handleFileUpload = () => {
      const toastId = toast(
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <div className="flex-1">
            <p className="font-medium">Uploading file...</p>
            <p className="text-sm text-muted-foreground">0%</p>
          </div>
        </div>,
        {
          duration: Infinity,
        }
      );

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;

        if (progress <= 100) {
          toast(
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <div className="flex-1">
                <p className="font-medium">Uploading file...</p>
                <p className="text-sm text-muted-foreground">{progress}%</p>
              </div>
            </div>,
            {
              id: toastId,
              duration: Infinity,
            }
          );
        }

        if (progress === 100) {
          clearInterval(interval);
          toast.success(
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 text-green-500">✓</div>
              <div className="flex-1">
                <p className="font-medium">Upload complete!</p>
                <p className="text-sm text-muted-foreground">
                  document.pdf uploaded successfully
                </p>
              </div>
            </div>,
            {
              id: toastId,
              action: {
                label: "View",
                onClick: () => console.log("View file"),
              },
            }
          );
        }
      }, 500);
    };

    return (
      <div className="space-y-4">
        <Button onClick={handleFileUpload}>
          Simulate File Upload
        </Button>
        <Button
          onClick={() => {
            toast("You have 3 new messages", {
              description: "From John, Sarah, and Mike",
              action: {
                label: "View",
                onClick: () => console.log("View messages"),
              },
              duration: 10000,
            });
          }}
          variant="outline"
        >
          Message Notification
        </Button>
        <Button
          onClick={() => {
            toast.error("Failed to save changes", {
              description: "Please check your internet connection and try again",
              action: {
                label: "Retry",
                onClick: () => toast.success("Changes saved successfully!"),
              },
              closeButton: true,
            });
          }}
          variant="outline"
        >
          Error with Retry
        </Button>
      </div>
    );
  },
};