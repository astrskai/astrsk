import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components-v2/ui/popover";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/components-v2/ui/label";
import { Calendar, Settings, Info, HelpCircle } from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithIcon: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="min-h-4 min-w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Settings</h4>
            <p className="text-sm text-muted-foreground">
              Manage your preferences
            </p>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start">
              <Settings className="mr-2 min-h-4 min-w-4" />
              Account Settings
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="mr-2 min-h-4 min-w-4" />
              Calendar Preferences
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Positions: Story = {
  args: {},
  render: () => (
    <div className="flex gap-8 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p>Popover content positioned at top</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p>Popover content positioned at right</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p>Popover content positioned at bottom</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p>Popover content positioned at left</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const AlignmentOptions: Story = {
  args: {},
  render: () => (
    <div className="flex gap-8 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Start Aligned</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <p>This popover is aligned to the start of the trigger</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Center Aligned</Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-80">
          <p>This popover is center aligned (default)</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">End Aligned</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <p>This popover is aligned to the end of the trigger</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const FormExample: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Update Profile</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Profile</h4>
            <p className="text-sm text-muted-foreground">
              Update your profile information.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="Software developer passionate about creating great user experiences."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Save Changes</Button>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const InfoPopover: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-2">
      <span>Hover for more info</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <Info className="min-h-4 min-w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-2">
            <h4 className="font-semibold">Information</h4>
            <p className="text-sm">
              This is additional information that helps explain this feature.
              Click outside or press Escape to close this popover.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const ControlledPopover: Story = {
  args: {},
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)} disabled={open}>
            Open Popover
          </Button>
          <Button onClick={() => setOpen(false)} disabled={!open}>
            Close Popover
          </Button>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">Controlled Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-2">
              <h4 className="font-medium">Controlled State</h4>
              <p className="text-sm text-muted-foreground">
                This popover is controlled by state. Current state: {open ? "Open" : "Closed"}
              </p>
              <Button size="sm" onClick={() => setOpen(false)}>
                Close from inside
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

export const CustomWidth: Story = {
  args: {},
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Small Width</Button>
        </PopoverTrigger>
        <PopoverContent className="w-40">
          <p className="text-sm">This is a narrow popover</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Default Width</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm">This uses the default width</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Large Width</Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <p className="text-sm">
            This is a wider popover that can contain more content and longer text without wrapping too much.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const ComplexContent: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Show Details</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <HelpCircle className="min-h-6 min-w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Help & Support</h4>
              <p className="text-xs text-muted-foreground">
                Get help with your account
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              View Documentation
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              Contact Support
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              Report an Issue
            </Button>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Need immediate help? Call us at 1-800-HELP
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const InteractiveExample: Story = {
  args: {},
  render: () => {
    const [name, setName] = React.useState("Guest");
    const [tempName, setTempName] = React.useState(name);
    const [open, setOpen] = React.useState(false);

    const handleSave = () => {
      setName(tempName);
      setOpen(false);
    };

    const handleCancel = () => {
      setTempName(name);
      setOpen(false);
    };

    return (
      <div className="space-y-4">
        <p className="text-lg">Welcome, <span className="font-semibold">{name}</span>!</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">Change Name</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Update Name</h4>
                <p className="text-sm text-muted-foreground">
                  Change how we address you
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};