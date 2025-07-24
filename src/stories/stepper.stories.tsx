import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "@/components-v2/stepper";
import React from "react";

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Create New Project",
    description: "Follow these steps to set up your project",
    steps: [
      {
        label: "Basic Info",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "Configuration",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold mb-4">Configuration Settings</h3>
            <div className="space-y-4 max-w-md">
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Enable notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Public visibility</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Allow collaborators</span>
              </label>
            </div>
          </div>
        ),
      },
      {
        label: "Review",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold mb-4">Review & Confirm</h3>
            <div className="space-y-2 max-w-md">
              <p>Please review your settings before creating the project.</p>
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-medium">Summary:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Project will be created with provided settings</li>
                  <li>• You can modify these settings later</li>
                  <li>• Click Finish to create the project</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
    ],
    validation: {
      0: true,
      1: true,
      2: true,
    },
  },
};

export const WithValidation: Story = {
  render: () => {
    const [validation, setValidation] = React.useState({
      0: false,
      1: false,
      2: false,
    });
    const [formData, setFormData] = React.useState({
      name: "",
      email: "",
      terms: false,
    });

    return (
      <Stepper
        title="User Registration"
        description="Complete all steps to create your account"
        steps={[
          {
            label: "Personal Info",
            content: (
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setFormData({ ...formData, name: newName });
                        setValidation({ ...validation, 0: newName.length > 2 });
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter your full name"
                    />
                    {formData.name && formData.name.length <= 2 && (
                      <p className="text-sm text-destructive mt-1">
                        Name must be at least 3 characters
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: "Contact",
            content: (
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        const newEmail = e.target.value;
                        setFormData({ ...formData, email: newEmail });
                        setValidation({
                          ...validation,
                          1: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail),
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter your email"
                    />
                    {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                      <p className="text-sm text-destructive mt-1">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: "Terms",
            content: (
              <div className="p-8">
                <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
                <div className="space-y-4 max-w-md">
                  <div className="p-4 bg-muted rounded-md h-32 overflow-auto text-sm">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                    <p className="mt-2">Sed do eiusmod tempor incididunt ut labore...</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({ ...formData, terms: checked });
                        setValidation({ ...validation, 2: checked });
                      }}
                    />
                    <span>I agree to the terms and conditions *</span>
                  </label>
                </div>
              </div>
            ),
          },
        ]}
        validation={validation}
        onFinish={() => {
          alert("Registration completed!");
          return true;
        }}
      />
    );
  },
};

export const AllStepsAccessible: Story = {
  args: {
    title: "Edit Profile",
    description: "Update your profile information",
    allVisitted: true,
    steps: [
      {
        label: "Profile",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Profile Information</h3>
            <p className="mt-2 text-muted-foreground">
              All steps are accessible - you can navigate freely
            </p>
          </div>
        ),
      },
      {
        label: "Settings",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Account Settings</h3>
            <p className="mt-2 text-muted-foreground">
              Jump to any step without restrictions
            </p>
          </div>
        ),
      },
      {
        label: "Privacy",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Privacy Options</h3>
            <p className="mt-2 text-muted-foreground">
              Configure your privacy preferences
            </p>
          </div>
        ),
      },
    ],
    validation: {
      0: true,
      1: true,
      2: true,
    },
  },
};

export const SaveMode: Story = {
  args: {
    title: "Product Setup",
    description: "Configure your product details",
    isSave: true,
    steps: [
      {
        label: "Details",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Product Details</h3>
            <p className="mt-2 text-muted-foreground">
              This stepper is in save mode - shows Save instead of Finish
            </p>
          </div>
        ),
      },
      {
        label: "Pricing",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Pricing Information</h3>
            <p className="mt-2 text-muted-foreground">Set your product pricing</p>
          </div>
        ),
      },
    ],
    validation: {
      0: true,
      1: true,
    },
    onFinish: () => {
      alert("Product saved!");
      return true;
    },
  },
};

export const NoConfirmDialog: Story = {
  args: {
    title: "Quick Setup",
    description: "A simple flow without confirmation dialogs",
    showConfirm: false,
    steps: [
      {
        label: "Step 1",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">First Step</h3>
            <p className="mt-2 text-muted-foreground">
              Cancel button works immediately without confirmation
            </p>
          </div>
        ),
      },
      {
        label: "Step 2",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Second Step</h3>
            <p className="mt-2 text-muted-foreground">No unsaved changes warning</p>
          </div>
        ),
      },
    ],
    validation: {
      0: true,
      1: true,
    },
  },
};

export const LongStepLabels: Story = {
  args: {
    title: "Complex Workflow",
    steps: [
      {
        label: "Initial Configuration",
        content: <div className="p-8">Step 1 content</div>,
      },
      {
        label: "Advanced Settings",
        content: <div className="p-8">Step 2 content</div>,
      },
      {
        label: "Integration Options",
        content: <div className="p-8">Step 3 content</div>,
      },
      {
        label: "Final Review & Submit",
        content: <div className="p-8">Step 4 content</div>,
      },
    ],
    validation: {
      0: true,
      1: true,
      2: true,
      3: true,
    },
  },
};

export const ManySteps: Story = {
  args: {
    title: "Extended Process",
    description: "A workflow with many steps",
    steps: Array.from({ length: 8 }, (_, i) => ({
      label: `Step ${i + 1}`,
      content: (
        <div className="p-8">
          <h3 className="text-lg font-semibold">Step {i + 1}</h3>
          <p className="mt-2 text-muted-foreground">
            Content for step {i + 1} of 8
          </p>
        </div>
      ),
    })),
    validation: Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [i, true])
    ),
  },
};

export const WithCallbacks: Story = {
  args: {
    title: "Interactive Stepper",
    description: "Demonstrates callback functions",
    steps: [
      {
        label: "Start",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Getting Started</h3>
            <p className="mt-2">Click Cancel or Finish to see callbacks in action</p>
          </div>
        ),
      },
      {
        label: "End",
        content: (
          <div className="p-8">
            <h3 className="text-lg font-semibold">Final Step</h3>
            <p className="mt-2">Ready to finish?</p>
          </div>
        ),
      },
    ],
    validation: {
      0: true,
      1: true,
    },
    onCancel: () => {
      alert("Cancel clicked - you can handle navigation here");
    },
    onFinish: async () => {
      const confirmed = window.confirm("Are you sure you want to finish?");
      if (confirmed) {
        alert("Process completed successfully!");
        return true; // Reset stepper
      }
      return false; // Don't reset stepper
    },
  },
};