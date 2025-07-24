import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@/components-v2/ui/separator";
import React from "react";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-muted-foreground">
          An open-source UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <p className="text-sm">Content above the separator</p>
      <Separator />
      <p className="text-sm">Content below the separator</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-[50px] items-center space-x-4">
      <div className="text-sm">Left</div>
      <Separator orientation="vertical" />
      <div className="text-sm">Center</div>
      <Separator orientation="vertical" />
      <div className="text-sm">Right</div>
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="w-[400px]">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Section 1</h3>
          <p className="text-sm text-muted-foreground">
            This is the first section of content.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold">Section 2</h3>
          <p className="text-sm text-muted-foreground">
            This is the second section of content.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold">Section 3</h3>
          <p className="text-sm text-muted-foreground">
            This is the third section of content.
          </p>
        </div>
      </div>
    </div>
  ),
};

export const InForm: Story = {
  render: () => (
    <div className="w-[350px] space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Personal Information</label>
        <input 
          type="text" 
          placeholder="Full name" 
          className="w-full px-3 py-2 border rounded-md"
        />
        <input 
          type="email" 
          placeholder="Email address" 
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Account Settings</label>
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full px-3 py-2 border rounded-md"
        />
        <input 
          type="password" 
          placeholder="Confirm password" 
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
    </div>
  ),
};

export const Navigation: Story = {
  render: () => (
    <nav className="flex items-center space-x-4">
      <a href="#" className="text-sm font-medium hover:underline">Home</a>
      <Separator orientation="vertical" className="h-4" />
      <a href="#" className="text-sm font-medium hover:underline">Products</a>
      <Separator orientation="vertical" className="h-4" />
      <a href="#" className="text-sm font-medium hover:underline">About</a>
      <Separator orientation="vertical" className="h-4" />
      <a href="#" className="text-sm font-medium hover:underline">Contact</a>
    </nav>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="w-[400px] space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium">Default separator</p>
        <Separator />
      </div>
      
      <div className="space-y-4">
        <p className="text-sm font-medium">Thicker separator</p>
        <Separator className="h-[2px]" />
      </div>
      
      <div className="space-y-4">
        <p className="text-sm font-medium">Dashed separator</p>
        <div className="border-t-2 border-dashed border-border-divider" />
      </div>
      
      <div className="space-y-4">
        <p className="text-sm font-medium">Colored separator</p>
        <Separator className="bg-primary" />
      </div>
      
      <div className="space-y-4">
        <p className="text-sm font-medium">With margin</p>
        <Separator className="my-8" />
      </div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="w-[350px] rounded-lg border p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Account Overview</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>user@example.com</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span>Pro</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-green-600">Active</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between">
          <button className="text-sm text-primary hover:underline">
            Edit Profile
          </button>
          <button className="text-sm text-destructive hover:underline">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  ),
};

export const Timeline: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm">
          1
        </div>
        <span className="text-xs mt-1">Start</span>
      </div>
      
      <Separator className="flex-1" />
      
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm">
          2
        </div>
        <span className="text-xs mt-1">Process</span>
      </div>
      
      <Separator className="flex-1" />
      
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full border-2 border-muted-foreground flex items-center justify-center text-sm">
          3
        </div>
        <span className="text-xs mt-1">Complete</span>
      </div>
    </div>
  ),
};

export const MultipleOrientations: Story = {
  render: () => (
    <div className="w-[400px]">
      <div className="grid grid-cols-3 gap-4 h-[200px]">
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Column 1</h4>
          <p className="text-sm text-muted-foreground">Content here</p>
        </div>
        
        <div className="flex items-center">
          <Separator orientation="vertical" className="mx-auto" />
        </div>
        
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Column 2</h4>
          <p className="text-sm text-muted-foreground">Content here</p>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="text-center text-sm text-muted-foreground">
        Footer content separated by horizontal line
      </div>
    </div>
  ),
};