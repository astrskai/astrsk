import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/components-v2/ui/label";
import { Input } from "@/components-v2/ui/input";
import { Checkbox } from "@/components-v2/ui/checkbox";
import { Textarea } from "@/components-v2/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components-v2/ui/radio-group";

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Label text",
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea id="message" placeholder="Type your message here." />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </Label>
    </div>
  ),
};

export const WithRadioGroup: Story = {
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

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="username">
        Username <span className="text-destructive">*</span>
      </Label>
      <Input type="text" id="username" placeholder="Enter username" />
    </div>
  ),
};

export const WithHelpText: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" placeholder="Enter password" />
      <p className="text-sm text-muted-foreground">
        Must be at least 8 characters.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="disabled-input">Disabled input</Label>
        <Input type="text" id="disabled-input" placeholder="Disabled" disabled />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checkbox" disabled />
        <Label htmlFor="disabled-checkbox">Disabled checkbox label</Label>
      </div>
    </div>
  ),
};

export const AllExamples: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Form Labels</h3>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Doe" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email-2">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input type="email" id="email-2" placeholder="john@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself" />
            <p className="text-sm text-muted-foreground">
              Write a short bio. Max 200 characters.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Selection Labels</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Notification preferences</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="email-notif" />
                <Label htmlFor="email-notif" className="font-normal">
                  Email notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="sms-notif" />
                <Label htmlFor="sms-notif" className="font-normal">
                  SMS notifications
                </Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Choose a plan</Label>
            <RadioGroup defaultValue="free">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="font-normal">Free</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id="pro" />
                <Label htmlFor="pro" className="font-normal">Pro ($9/month)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team" className="font-normal">Team ($29/month)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  ),
};