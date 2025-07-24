import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components-v2/ui/accordion";
import { ChevronDown } from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Accordion",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex-1 text-left">Is it accessible?</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <span className="flex-1 text-left">Is it styled?</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <span className="flex-1 text-left">Is it animated?</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const SingleOpen: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex-1 text-left">Section 1</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          This is the content for section 1. Only one section can be open at a time.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <span className="flex-1 text-left">Section 2</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          This is the content for section 2. Opening this will close section 1.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <span className="flex-1 text-left">Section 3</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          This is the content for section 3. Only one accordion item can be expanded.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const MultipleOpen: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["item-1", "item-3"]} className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex-1 text-left">First Section</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          Multiple sections can be open at the same time when using type="multiple".
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <span className="flex-1 text-left">Second Section</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          This accordion allows multiple items to be expanded simultaneously.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <span className="flex-1 text-left">Third Section</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          Both this section and the first section are open by default.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const FAQ: Story = {
  render: () => (
    <div className="w-[600px]">
      <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <span className="flex-1 text-left">What payment methods do you accept?</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent>
            We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers. All payments are processed securely through our payment partners.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <span className="flex-1 text-left">Can I change my plan later?</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent>
            Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle. If you upgrade, you'll be charged a prorated amount for the remainder of the current billing period.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <span className="flex-1 text-left">Do you offer refunds?</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent>
            We offer a 30-day money-back guarantee for all new customers. If you're not satisfied with our service within the first 30 days, contact our support team for a full refund.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>
            <span className="flex-1 text-left">Is my data secure?</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent>
            Yes, we take security very seriously. All data is encrypted in transit and at rest using industry-standard encryption protocols. We are SOC 2 certified and undergo regular security audits.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const WithComplexContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex-1 text-left">User Settings</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Profile Information</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Update your name and email</p>
                <p>• Change your profile picture</p>
                <p>• Set your timezone and language</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Privacy Settings</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Control who can see your profile</p>
                <p>• Manage data sharing preferences</p>
                <p>• Download your data</p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <span className="flex-1 text-left">API Documentation</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <code className="block p-3 bg-muted rounded-md text-sm">
              GET /api/v1/users
            </code>
            <p className="text-sm">
              Returns a list of all users in your organization. Requires authentication token in header.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Parameters:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <code>limit</code> - Number of results (default: 20)</li>
                <li>• <code>offset</code> - Pagination offset</li>
                <li>• <code>sort</code> - Sort field and order</li>
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Nested: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex-1 text-left">Main Category</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent>
          <p className="mb-4">This is the main category content.</p>
          <Accordion type="single" collapsible className="ml-4">
            <AccordionItem value="sub-1">
              <AccordionTrigger>
                <span className="flex-1 text-left">Subcategory 1</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
              </AccordionTrigger>
              <AccordionContent>
                Content for subcategory 1
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sub-2">
              <AccordionTrigger>
                <span className="flex-1 text-left">Subcategory 2</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
              </AccordionTrigger>
              <AccordionContent>
                Content for subcategory 2
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-b-2 border-primary">
          <AccordionTrigger className="text-primary hover:no-underline">
            <span className="flex-1 text-left">Primary styled trigger</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-primary transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent className="text-primary">
            This accordion has custom primary color styling.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="rounded-md border p-4">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="hover:no-underline pb-2">
            <span className="flex-1 text-left">Boxed accordion</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionTrigger>
          <AccordionContent>
            This accordion is wrapped in a bordered container with padding.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState<string | undefined>();

    return (
      <div className="w-[400px] space-y-4">
        <Accordion 
          type="single" 
          collapsible 
          value={value}
          onValueChange={setValue}
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Section 1
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent>
              Content for section 1
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Section 2
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent>
              Content for section 2
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Section 3
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent>
              Content for section 3
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="text-sm text-muted-foreground">
          Currently open: {value || "none"}
        </div>
      </div>
    );
  },
};