import type { Meta, StoryObj } from "@storybook/react";
import {
  Typo3XLarge,
  Typo2XLarge,
  TypoXLarge,
  TypoLarge,
  TypoBase,
  TypoSmall,
  TypoTiny,
} from "@/components-v2/typo";

// Meta without component due to TypeScript limitations with render functions
const meta = {
  title: "Components/Typography",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Typo3XLarge>3X Large Typography</Typo3XLarge>
      <Typo2XLarge>2X Large Typography</Typo2XLarge>
      <TypoXLarge>X Large Typography</TypoXLarge>
      <TypoLarge>Large Typography</TypoLarge>
      <TypoBase>Base Typography</TypoBase>
      <TypoSmall>Small Typography</TypoSmall>
      <TypoTiny>Tiny Typography</TypoTiny>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <Typo3XLarge>
        The Quick Brown Fox Jumps Over the Lazy Dog
      </Typo3XLarge>
      <Typo2XLarge>
        Pack my box with five dozen liquor jugs for the journey ahead
      </Typo2XLarge>
      <TypoXLarge>
        Amazingly few discotheques provide jukeboxes that work correctly
      </TypoXLarge>
      <TypoLarge>
        The five boxing wizards jump quickly across the moonlit stage
      </TypoLarge>
      <TypoBase>
        How vexingly quick daft zebras jump when they see the approaching lion
      </TypoBase>
      <TypoSmall>
        Sphinx of black quartz, judge my vow to serve and protect the innocent
      </TypoSmall>
      <TypoTiny>
        The job requires extra pluck and zeal from every young wage earner who wants to succeed
      </TypoTiny>
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-4">
      <Typo3XLarge className="text-primary">Primary Color</Typo3XLarge>
      <Typo2XLarge className="text-destructive">Destructive Color</Typo2XLarge>
      <TypoXLarge className="text-muted-foreground">Muted Foreground</TypoXLarge>
      <TypoLarge className="text-green-600">Custom Green</TypoLarge>
      <TypoBase className="text-blue-600">Custom Blue</TypoBase>
      <TypoSmall className="text-purple-600">Custom Purple</TypoSmall>
      <TypoTiny className="text-gray-500">Custom Gray</TypoTiny>
    </div>
  ),
};

export const HeadingHierarchy: Story = {
  render: () => (
    <article className="space-y-4 max-w-2xl">
      <Typo3XLarge>Main Page Title</Typo3XLarge>
      <TypoBase className="text-muted-foreground">
        Published on December 25, 2024 by John Doe
      </TypoBase>
      
      <div className="space-y-3 pt-4">
        <Typo2XLarge>Introduction Section</Typo2XLarge>
        <TypoBase>
          This is the introduction paragraph that provides context for the entire article.
          It uses base typography for regular body text.
        </TypoBase>
      </div>

      <div className="space-y-3 pt-4">
        <TypoXLarge>First Subsection</TypoXLarge>
        <TypoBase>
          Content for the first subsection goes here. Notice how the hierarchy
          creates visual structure.
        </TypoBase>
        
        <TypoLarge>Sub-subsection Title</TypoLarge>
        <TypoBase>
          Additional details are provided in this nested section.
        </TypoBase>
      </div>

      <div className="pt-6 border-t">
        <TypoSmall className="text-muted-foreground">
          Footer note: This is supplementary information
        </TypoSmall>
      </div>
    </article>
  ),
};

export const FormLabels: Story = {
  render: () => (
    <form className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <TypoSmall>Username</TypoSmall>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter username"
        />
        <TypoTiny className="text-muted-foreground">
          Must be 3-20 characters long
        </TypoTiny>
      </div>

      <div className="space-y-2">
        <TypoSmall>Email Address</TypoSmall>
        <input
          type="email"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter email"
        />
        <TypoTiny className="text-muted-foreground">
          We'll never share your email
        </TypoTiny>
      </div>

      <div className="space-y-2">
        <TypoSmall>Password</TypoSmall>
        <input
          type="password"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter password"
        />
        <TypoTiny className="text-destructive">
          Password must be at least 8 characters
        </TypoTiny>
      </div>
    </form>
  ),
};

export const CardExample: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[800px]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 border rounded-lg space-y-3">
          <TypoLarge>Card Title {i}</TypoLarge>
          <TypoBase className="text-muted-foreground">
            This is the card description that provides more details about the content.
          </TypoBase>
          <div className="pt-4 flex items-center justify-between">
            <TypoSmall className="text-primary">Learn more →</TypoSmall>
            <TypoTiny className="text-muted-foreground">2 min read</TypoTiny>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <Typo2XLarge>Dashboard</Typo2XLarge>
        <TypoBase className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </TypoBase>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <TypoSmall className="text-muted-foreground">Total Users</TypoSmall>
          <Typo2XLarge>1,234</Typo2XLarge>
          <TypoTiny className="text-green-600">+12% from last month</TypoTiny>
        </div>
        <div className="p-4 border rounded-lg">
          <TypoSmall className="text-muted-foreground">Revenue</TypoSmall>
          <Typo2XLarge>$45.2K</Typo2XLarge>
          <TypoTiny className="text-green-600">+8% from last month</TypoTiny>
        </div>
        <div className="p-4 border rounded-lg">
          <TypoSmall className="text-muted-foreground">Active Sessions</TypoSmall>
          <Typo2XLarge>573</Typo2XLarge>
          <TypoTiny className="text-red-600">-3% from last month</TypoTiny>
        </div>
        <div className="p-4 border rounded-lg">
          <TypoSmall className="text-muted-foreground">Conversion</TypoSmall>
          <Typo2XLarge>2.4%</Typo2XLarge>
          <TypoTiny className="text-muted-foreground">No change</TypoTiny>
        </div>
      </div>
    </div>
  ),
};

export const TextAlignment: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <TypoLarge className="text-left">Left Aligned Text</TypoLarge>
      <TypoLarge className="text-center">Center Aligned Text</TypoLarge>
      <TypoLarge className="text-right">Right Aligned Text</TypoLarge>
      <TypoBase className="text-justify">
        This is justified text that will stretch to fill the entire width of its container.
        Notice how the spacing between words adjusts to create even margins on both sides.
        This is useful for creating newspaper-style layouts.
      </TypoBase>
    </div>
  ),
};

export const TextDecoration: Story = {
  render: () => (
    <div className="space-y-4">
      <TypoBase className="underline">Underlined Text</TypoBase>
      <TypoBase className="line-through">Strikethrough Text</TypoBase>
      <TypoBase className="italic">Italic Text</TypoBase>
      <TypoBase className="font-bold">Bold Text (overriding default)</TypoBase>
      <TypoBase className="uppercase">Uppercase Text</TypoBase>
      <TypoBase className="lowercase">LOWERCASE TEXT</TypoBase>
      <TypoBase className="capitalize">capitalized text example</TypoBase>
    </div>
  ),
};

export const ResponsiveTypography: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold">
        Responsive text that grows with screen size
      </div>
      <TypoBase className="text-xs sm:text-sm md:text-base lg:text-lg">
        This text adapts to different screen sizes using Tailwind's responsive utilities
      </TypoBase>
    </div>
  ),
};