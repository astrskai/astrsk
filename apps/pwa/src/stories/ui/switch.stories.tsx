import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components-v2/ui/switch";
import { Label } from "@/shared/ui/label";
import React from "react";

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "v1"],
    },
    size: {
      control: "select",
      options: ["small", "medium"],
    },
    disabled: {
      control: "boolean",
    },
    checked: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const SmallSize: Story = {
  args: {
    size: "small",
  },
};

export const V1Variant: Story = {
  args: {
    variant: "v1",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Default Variant</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="default-unchecked" />
            <Label htmlFor="default-unchecked">Default - Unchecked</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="default-checked" defaultChecked />
            <Label htmlFor="default-checked">Default - Checked</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="default-disabled" disabled />
            <Label htmlFor="default-disabled">Default - Disabled</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="default-disabled-checked" disabled defaultChecked />
            <Label htmlFor="default-disabled-checked">Default - Disabled Checked</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">V1 Variant</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Switch variant="v1" id="v1-unchecked" />
            <Label htmlFor="v1-unchecked">V1 - Unchecked</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch variant="v1" id="v1-checked" defaultChecked />
            <Label htmlFor="v1-checked">V1 - Checked</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch variant="v1" id="v1-disabled" disabled />
            <Label htmlFor="v1-disabled">V1 - Disabled</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch variant="v1" id="v1-disabled-checked" disabled defaultChecked />
            <Label htmlFor="v1-disabled-checked">V1 - Disabled Checked</Label>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch size="small" id="small-size" />
          <Label htmlFor="small-size">Small</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch size="medium" id="medium-size" />
          <Label htmlFor="medium-size">Medium (default)</Label>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch size="small" id="small-size-checked" defaultChecked />
          <Label htmlFor="small-size-checked">Small - Checked</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch size="medium" id="medium-size-checked" defaultChecked />
          <Label htmlFor="medium-size-checked">Medium - Checked</Label>
        </div>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="controlled"
            checked={checked}
            onCheckedChange={setChecked}
          />
          <Label htmlFor="controlled">
            Controlled Switch
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Switch is: {checked ? "ON" : "OFF"}
        </p>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <h3 className="text-lg font-semibold">Notification Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="marketing">Marketing emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new products and features.
            </p>
          </div>
          <Switch id="marketing" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="security">Security alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about security updates.
            </p>
          </div>
          <Switch id="security" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="updates">Product updates</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about product changes.
            </p>
          </div>
          <Switch id="updates" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newsletter">Newsletter</Label>
            <p className="text-sm text-muted-foreground">
              Monthly newsletter subscription.
            </p>
          </div>
          <Switch id="newsletter" defaultChecked />
        </div>
      </div>
    </div>
  ),
};