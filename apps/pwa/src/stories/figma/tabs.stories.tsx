import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components-v2/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components-v2/ui/card";
import { Input } from "@/components-v2/ui/input";
import { Label } from "@/components-v2/ui/label";
import { Button } from "@/shared/ui/button";
import React from "react";

/**
 * Tabs Component
 * 
 * Figma Design Reference:
 * https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-236179&m=dev
 */
const meta = {
  title: "Figma/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Tab navigation component with multiple style variants.
        
**Figma Design:** <a href="https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-236179&m=dev" target="_blank" rel="noopener noreferrer">View in Figma</a>`,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// Figma: https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=25004-236179&m=dev
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const V1Variant: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList variant="v1">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-sm">Content for tab 1 with v1 styling</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-sm">Content for tab 2 with v1 styling</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-sm">Content for tab 3 with v1 styling</p>
      </TabsContent>
    </Tabs>
  ),
};

export const MobileVariant: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[350px]">
      <TabsList variant="mobile">
        <TabsTrigger value="tab1">Home</TabsTrigger>
        <TabsTrigger value="tab2">Profile</TabsTrigger>
        <TabsTrigger value="tab3">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4 bg-background-surface-2 rounded-lg">
          <h3 className="font-semibold mb-2">Home</h3>
          <p className="text-sm text-muted-foreground">Welcome to your home tab</p>
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4 bg-background-surface-2 rounded-lg">
          <h3 className="font-semibold mb-2">Profile</h3>
          <p className="text-sm text-muted-foreground">Manage your profile information</p>
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4 bg-background-surface-2 rounded-lg">
          <h3 className="font-semibold mb-2">Settings</h3>
          <p className="text-sm text-muted-foreground">Configure your preferences</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const DarkMobileVariant: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[350px]">
      <TabsList variant="dark-mobile">
        <TabsTrigger value="tab1">Overview</TabsTrigger>
        <TabsTrigger value="tab2">Analytics</TabsTrigger>
        <TabsTrigger value="tab3">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4 bg-background-surface-1 rounded-lg">
          <h3 className="font-semibold mb-2">Overview</h3>
          <p className="text-sm text-muted-foreground">Dashboard overview content</p>
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4 bg-background-surface-1 rounded-lg">
          <h3 className="font-semibold mb-2">Analytics</h3>
          <p className="text-sm text-muted-foreground">View your analytics data</p>
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4 bg-background-surface-1 rounded-lg">
          <h3 className="font-semibold mb-2">Reports</h3>
          <p className="text-sm text-muted-foreground">Generate and view reports</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="tab1">General</TabsTrigger>
        <TabsTrigger value="tab2">Security</TabsTrigger>
        <TabsTrigger value="tab3">Notifications</TabsTrigger>
        <TabsTrigger value="tab4">Privacy</TabsTrigger>
        <TabsTrigger value="tab5">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-sm">General settings content</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-sm">Security settings content</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-sm">Notification preferences content</p>
      </TabsContent>
      <TabsContent value="tab4">
        <p className="text-sm">Privacy settings content</p>
      </TabsContent>
      <TabsContent value="tab5">
        <p className="text-sm">Advanced settings content</p>
      </TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Available</TabsTrigger>
        <TabsTrigger value="tab2" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="tab3">Another Tab</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-sm">This tab is available</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-sm">This tab is also available</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = React.useState("tab1");

    return (
      <div className="w-[400px] space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p className="text-sm">Content for tab 1</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm">Content for tab 2</p>
          </TabsContent>
          <TabsContent value="tab3">
            <p className="text-sm">Content for tab 3</p>
          </TabsContent>
        </Tabs>
        <p className="text-sm text-muted-foreground">
          Active tab: <span className="font-medium">{activeTab}</span>
        </p>
      </div>
    );
  },
};

export const CodeEditor: Story = {
  render: () => (
    <Tabs defaultValue="html" className="w-[500px]">
      <TabsList variant="v1">
        <TabsTrigger value="html">HTML</TabsTrigger>
        <TabsTrigger value="css">CSS</TabsTrigger>
        <TabsTrigger value="js">JavaScript</TabsTrigger>
      </TabsList>
      <TabsContent value="html">
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          <pre>{`<div class="container">
  <h1>Hello World</h1>
  <p>This is a paragraph.</p>
</div>`}</pre>
        </div>
      </TabsContent>
      <TabsContent value="css">
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          <pre>{`.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`}</pre>
        </div>
      </TabsContent>
      <TabsContent value="js">
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          <pre>{`function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`}</pre>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      <div>
        <h3 className="text-sm font-medium mb-2">Default variant</h3>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p className="text-sm">Default variant content</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm">Default variant content</p>
          </TabsContent>
          <TabsContent value="tab3">
            <p className="text-sm">Default variant content</p>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">V1 variant</h3>
        <Tabs defaultValue="tab1">
          <TabsList variant="v1">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p className="text-sm">V1 variant content</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm">V1 variant content</p>
          </TabsContent>
          <TabsContent value="tab3">
            <p className="text-sm">V1 variant content</p>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Mobile variant</h3>
        <Tabs defaultValue="tab1">
          <TabsList variant="mobile">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p className="text-sm">Mobile variant content</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm">Mobile variant content</p>
          </TabsContent>
          <TabsContent value="tab3">
            <p className="text-sm">Mobile variant content</p>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Dark mobile variant</h3>
        <Tabs defaultValue="tab1">
          <TabsList variant="dark-mobile">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p className="text-sm">Dark mobile variant content</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm">Dark mobile variant content</p>
          </TabsContent>
          <TabsContent value="tab3">
            <p className="text-sm">Dark mobile variant content</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};