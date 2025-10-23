import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "@/components-v2/ui/radio-group";
import { Label } from "@/shared/ui/label";
import React from "react";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="option-three" />
        <Label htmlFor="option-three">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" disabled>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="disabled-1" />
        <Label htmlFor="disabled-1">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="disabled-2" />
        <Label htmlFor="disabled-2">Option Two</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="mixed-1" />
        <Label htmlFor="mixed-1">Available Option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="mixed-2" disabled />
        <Label htmlFor="mixed-2" className="opacity-50">
          Disabled Option
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="mixed-3" />
        <Label htmlFor="mixed-3">Another Available Option</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" className="flex flex-row gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="h1" />
        <Label htmlFor="h1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="h2" />
        <Label htmlFor="h2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="h3" />
        <Label htmlFor="h3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState("option-one");

    return (
      <div className="space-y-4">
        <RadioGroup value={value} onValueChange={setValue}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-one" id="controlled-1" />
            <Label htmlFor="controlled-1">Option One</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-two" id="controlled-2" />
            <Label htmlFor="controlled-2">Option Two</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-three" id="controlled-3" />
            <Label htmlFor="controlled-3">Option Three</Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-muted-foreground">
          Selected value: {value}
        </p>
      </div>
    );
  },
};

export const PlanSelector: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose a plan</h3>
        <RadioGroup defaultValue="pro">
          <div className="flex items-start space-x-2 p-4 rounded-lg border border-transparent hover:border-border">
            <RadioGroupItem value="free" id="plan-free" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="plan-free" className="text-base font-medium cursor-pointer">
                Free
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Perfect for trying out our service
              </p>
              <p className="text-sm font-medium mt-2">$0/month</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 p-4 rounded-lg border border-transparent hover:border-border">
            <RadioGroupItem value="pro" id="plan-pro" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="plan-pro" className="text-base font-medium cursor-pointer">
                Pro
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                For professionals and small teams
              </p>
              <p className="text-sm font-medium mt-2">$9/month</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 p-4 rounded-lg border border-transparent hover:border-border">
            <RadioGroupItem value="team" id="plan-team" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="plan-team" className="text-base font-medium cursor-pointer">
                Team
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Advanced features for growing teams
              </p>
              <p className="text-sm font-medium mt-2">$29/month</p>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};

export const SettingsExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-2">Theme</h3>
        <RadioGroup defaultValue="system">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="theme-light" />
            <Label htmlFor="theme-light">Light</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="theme-dark" />
            <Label htmlFor="theme-dark">Dark</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="theme-system" />
            <Label htmlFor="theme-system">System</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Language</h3>
        <RadioGroup defaultValue="en">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="en" id="lang-en" />
            <Label htmlFor="lang-en">English</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="es" id="lang-es" />
            <Label htmlFor="lang-es">Español</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fr" id="lang-fr" />
            <Label htmlFor="lang-fr">Français</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="de" id="lang-de" />
            <Label htmlFor="lang-de">Deutsch</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
        <RadioGroup defaultValue="important">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="notif-all" />
            <Label htmlFor="notif-all">All notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="important" id="notif-important" />
            <Label htmlFor="notif-important">Important only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="notif-none" />
            <Label htmlFor="notif-none">None</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};