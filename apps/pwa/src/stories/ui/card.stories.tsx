import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components-v2/ui/card";
import { Button } from "@/components-v2/ui/button";
import { Input } from "@/components-v2/ui/input";
import { Label } from "@/components-v2/ui/label";
import { Badge } from "@/components-v2/ui/badge";
import { Separator } from "@/components-v2/ui/separator";
import React from "react";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This is the card content area where you can place any content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Newsletter</CardTitle>
        <CardDescription>Subscribe to our newsletter for updates.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Subscribe</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <p className="text-sm">This is a simple card with just content and padding.</p>
    </Card>
  ),
};

export const NoDescription: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Enable notifications</Label>
            <input type="checkbox" id="notifications" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing">Marketing emails</Label>
            <input type="checkbox" id="marketing" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-semibold">JD</span>
          </div>
          <div>
            <CardTitle>John Doe</CardTitle>
            <CardDescription>john.doe@example.com</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span>Administrator</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Joined</span>
            <span>Jan 2024</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          Edit Profile
        </Button>
        <Button size="sm" className="flex-1">
          View Details
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader className="pb-2">
        <CardDescription>Total Revenue</CardDescription>
        <CardTitle className="text-3xl">$45,231.89</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[800px]">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl">1,234</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">+10% from last week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Active Sessions</CardDescription>
          <CardTitle className="text-2xl">342</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Currently online</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Conversion Rate</CardDescription>
          <CardTitle className="text-2xl">12.5%</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">+2.1% from yesterday</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const LoginCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="remember" className="rounded" />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button className="w-full">Sign In</Button>
        <Button variant="outline" className="w-full">
          Sign in with Google
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const PricingCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Pro Plan</CardTitle>
        <CardDescription>For growing businesses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <span className="text-4xl font-bold">$29</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <Separator />
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="mr-2">✓</span> Unlimited projects
          </li>
          <li className="flex items-center">
            <span className="mr-2">✓</span> Priority support
          </li>
          <li className="flex items-center">
            <span className="mr-2">✓</span> Advanced analytics
          </li>
          <li className="flex items-center">
            <span className="mr-2">✓</span> Custom integrations
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Get Started</Button>
      </CardFooter>
    </Card>
  ),
};

export const NotificationCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">New Message</CardTitle>
          <span className="text-xs text-muted-foreground">2 min ago</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          You have received a new message from Sarah Johnson regarding the project update.
        </p>
      </CardContent>
      <CardFooter className="pt-3">
        <Button size="sm" variant="outline" className="mr-2">
          Dismiss
        </Button>
        <Button size="sm">View Message</Button>
      </CardFooter>
    </Card>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle>Primary Border</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Card with custom primary border</p>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Tinted Background</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Card with custom background color</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Enhanced Shadow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Card with larger shadow</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const InteractiveCard: Story = {
  render: () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    return (
      <Card className="w-[350px] cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expandable Card</CardTitle>
            <span className="text-sm">{isExpanded ? "−" : "+"}</span>
          </div>
          <CardDescription>Click to expand</CardDescription>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <p className="text-sm">
              This is additional content that appears when the card is expanded.
              You can place any content here including forms, lists, or other components.
            </p>
          </CardContent>
        )}
      </Card>
    );
  },
};