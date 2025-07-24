import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components-v2/ui/sheet";
import { Button } from "@/components-v2/ui/button";
import { Input } from "@/components-v2/ui/input";
import { Label } from "@/components-v2/ui/label";
import React from "react";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

export const RightSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            Browse through different sections of the application
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-4">
          <a href="#" className="text-sm font-medium hover:underline">Home</a>
          <a href="#" className="text-sm font-medium hover:underline">About</a>
          <a href="#" className="text-sm font-medium hover:underline">Services</a>
          <a href="#" className="text-sm font-medium hover:underline">Contact</a>
          <a href="#" className="text-sm font-medium hover:underline">Blog</a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top Sheet</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            You have 3 unread messages
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">New message from Alice</p>
            <p className="text-xs text-muted-foreground">2 minutes ago</p>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Your order has been shipped</p>
            <p className="text-xs text-muted-foreground">1 hour ago</p>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Reminder: Team meeting at 3 PM</p>
            <p className="text-xs text-muted-foreground">3 hours ago</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Cookie Settings</SheetTitle>
          <SheetDescription>
            Manage your cookie preferences here
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="necessary">Necessary cookies</Label>
            <input type="checkbox" id="necessary" checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="analytics">Analytics cookies</Label>
            <input type="checkbox" id="analytics" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing">Marketing cookies</Label>
            <input type="checkbox" id="marketing" />
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button variant="outline">Reject All</Button>
          <Button>Accept Selected</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet (No X)</Button>
      </SheetTrigger>
      <SheetContent hideClose>
        <SheetHeader>
          <SheetTitle>Important Action Required</SheetTitle>
          <SheetDescription>
            You must complete this action before continuing. The close button has been hidden.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <p className="text-sm mb-4">
            Please review and accept the terms to continue.
          </p>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button>Accept & Continue</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const WithScrollableContent: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Scrollable Sheet</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Terms of Service</SheetTitle>
          <SheetDescription>
            Please read our terms of service carefully
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i}>
                <h3 className="font-medium">Section {i + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
          </div>
        </SheetBody>
        <SheetFooter variant="edit">
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const FormExample: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Create New Item</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Item</SheetTitle>
          <SheetDescription>
            Fill in the details below to create a new item
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter item title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              className="w-full px-3 py-2 border rounded-md" 
              rows={4}
              placeholder="Enter item description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select id="category" className="w-full px-3 py-2 border rounded-md">
              <option>Select category</option>
              <option>Technology</option>
              <option>Design</option>
              <option>Business</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" name="priority" value="low" className="mr-2" />
                <span className="text-sm">Low</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="priority" value="medium" className="mr-2" />
                <span className="text-sm">Medium</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="priority" value="high" className="mr-2" />
                <span className="text-sm">High</span>
              </label>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Create Item</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const NestedSheets: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open First Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>First Sheet</SheetTitle>
          <SheetDescription>
            This sheet contains a trigger for another sheet
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <p className="text-sm mb-4">
            You can open another sheet from within this sheet.
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Open Second Sheet</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Second Sheet</SheetTitle>
                <SheetDescription>
                  This is a nested sheet opened from the first one
                </SheetDescription>
              </SheetHeader>
              <p className="mt-4 text-sm">
                This demonstrates that sheets can be nested.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [name, setName] = React.useState("");

    return (
      <div className="space-y-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>Controlled Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Controlled Sheet</SheetTitle>
              <SheetDescription>
                This sheet's open state is controlled programmatically
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="controlled-name">Your Name</Label>
                <Input 
                  id="controlled-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <Button 
                onClick={() => {
                  alert(`Hello, ${name || 'Guest'}!`);
                  setOpen(false);
                }}
                disabled={!name}
              >
                Submit & Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="text-sm text-muted-foreground">
          Sheet is: {open ? "Open" : "Closed"}
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setOpen(true)}
        >
          Open Sheet Programmatically
        </Button>
      </div>
    );
  },
};