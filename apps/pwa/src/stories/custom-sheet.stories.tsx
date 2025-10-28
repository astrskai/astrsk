import type { Meta, StoryObj } from "@storybook/react";
import { CustomSheet } from "@/components-v2/custom-sheet";
import React from "react";
import {
  Button, Input, Label, Select,
  SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea,
} from "@/shared/ui";

const meta = {
  title: "Components/CustomSheet",
  component: CustomSheet,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CustomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as any,
  render: () => {
    return (
      <CustomSheet
        trigger={<Button>Open Sheet</Button>}
        title="Default Sheet"
      >
        <div className="space-y-4">
          <p>This is the default sheet content.</p>
          <p>The sheet has a fixed width of 780px and includes a header, scrollable content area, and footer.</p>
        </div>
      </CustomSheet>
    );
  },
};

export const WithForm: Story = {
  args: {} as any,
  render: () => {
    const [formData, setFormData] = React.useState({
      name: "",
      email: "",
      description: "",
    });

    return (
      <CustomSheet
        trigger={<Button>Create New Item</Button>}
        title="Create New Item"
        footer={(methods) => (
          <>
            <Button
              variant="outline"
              onClick={() => methods.setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                alert("Form submitted!");
                methods.setOpen(false);
              }}
            >
              Create
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter a description..."
              rows={4}
            />
          </div>
        </div>
      </CustomSheet>
    );
  },
};

export const FillMode: Story = {
  args: {} as any,
  render: () => {
    return (
      <CustomSheet
        trigger={<Button>Open Fill Mode Sheet</Button>}
        title="Full Width Content"
        fill
      >
        <div className="h-full bg-muted/50 p-8">
          <h3 className="text-lg font-semibold mb-4">Fill Mode Enabled</h3>
          <p>When fill mode is enabled, the content area has no padding and stretches to the full width of the sheet.</p>
          <div className="mt-8 p-4 bg-background rounded-lg">
            <p>This is useful for content that needs to utilize the full width, such as tables, images, or custom layouts.</p>
          </div>
        </div>
      </CustomSheet>
    );
  },
};

export const NoHeader: Story = {
  args: {} as any,
  render: () => {
    return (
      <CustomSheet
        trigger={<Button>Open No Header Sheet</Button>}
        hideHeader
        footer={(methods) => (
          <Button onClick={() => methods.setOpen(false)}>
            Close
          </Button>
        )}
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Custom Header</h2>
          <p>This sheet has hideHeader set to true, so you can create your own header within the content area.</p>
          <div className="p-4 border rounded-lg">
            <p>This gives you full control over the header design and layout.</p>
          </div>
        </div>
      </CustomSheet>
    );
  },
};

export const NoFooter: Story = {
  args: {} as any,
  render: () => {
    return (
      <CustomSheet
        trigger={<Button>Open No Footer Sheet</Button>}
        title="Sheet Without Footer"
        hideFooter
      >
        <div className="space-y-4">
          <p>This sheet has hideFooter set to true.</p>
          <p>Actions can be placed within the content area instead:</p>
          <p>Note: The sheet can only be closed via the X button or clicking outside since footer actions aren't available.</p>
        </div>
      </CustomSheet>
    );
  },
};

export const LongContent: Story = {
  args: {} as any,
  render: () => {
    return (
      <CustomSheet
        trigger={<Button>Open Long Content Sheet</Button>}
        title="Terms of Service"
        footer={(methods) => (
          <>
            <Button
              variant="outline"
              onClick={() => methods.setOpen(false)}
            >
              Decline
            </Button>
            <Button
              onClick={() => {
                alert("Terms accepted!");
                methods.setOpen(false);
              }}
            >
              Accept Terms
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i}>
              <h3 className="font-semibold mb-2">Section {i + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
                ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
        </div>
      </CustomSheet>
    );
  },
};

export const MultiStepForm: Story = {
  args: {} as any,
  render: () => {
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
      type: "",
      name: "",
      description: "",
      priority: "",
    });

    const handleNext = () => {
      if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
      if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
      alert(`Form submitted: ${JSON.stringify(formData, null, 2)}`);
      setStep(1);
    };

    return (
      <CustomSheet
        trigger={<Button>Create Task</Button>}
        title={`Create Task - Step ${step} of 3`}
        footer={(methods) => (
          <>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={() => {
                handleSubmit();
                methods.setOpen(false);
              }}>Create Task</Button>
            )}
          </>
        )}
        onOpenChange={(open) => {
          if (!open) setStep(1);
        }}
      >
        <div className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <h3 className="font-medium mb-4">Step 1: Basic Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taskName">Task Name</Label>
                    <Input
                      id="taskName"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter task name"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {step === 2 && (
            <>
              <div>
                <h3 className="font-medium mb-4">Step 2: Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskDescription">Description</Label>
                    <Textarea
                      id="taskDescription"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the task..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {step === 3 && (
            <>
              <div>
                <h3 className="font-medium mb-4">Step 3: Review</h3>
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{formData.type || "Not selected"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{formData.name || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{formData.description || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{formData.priority || "Not selected"}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CustomSheet>
    );
  },
};

export const WithCustomActions: Story = {
  args: {} as any,
  render: () => {
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async (setOpen: (open: boolean) => void) => {
      setIsSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSaving(false);
      setOpen(false);
      alert("Saved successfully!");
    };

    return (
      <CustomSheet
        trigger={<Button>Open with Custom Actions</Button>}
        title="Edit Profile"
        footer={(methods) => (
          <div className="flex justify-between w-full">
            <Button
              variant="ghost"
              onClick={() => alert("Help clicked!")}
            >
              Help
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => methods.setOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSave(methods.setOpen)}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          <p>This sheet demonstrates a custom footer with multiple action areas.</p>
          <p>The footer includes a help button on the left and save/cancel buttons on the right.</p>
          <p>The save button shows a loading state when clicked.</p>
        </div>
      </CustomSheet>
    );
  },
};