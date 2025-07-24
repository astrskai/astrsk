import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput, SearchInputMobile } from "@/components-v2/search-input";
import React from "react";

const meta = {
  title: "Components/SearchInput",
  component: SearchInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "v1", "mobile"],
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Search",
    variant: "default",
  },
};

export const V1Variant: Story = {
  args: {
    placeholder: "Search for items...",
    variant: "v1",
  },
};

export const MobileVariant: Story = {
  args: {
    placeholder: "Search",
    variant: "mobile",
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState("");

    return (
      <div className="space-y-4 w-[400px]">
        <SearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled search input"
        />
        <p className="text-sm text-muted-foreground">
          Current value: "{value}"
        </p>
      </div>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [defaultValue, setDefaultValue] = React.useState("");
    const [v1Value, setV1Value] = React.useState("");
    const [mobileValue, setMobileValue] = React.useState("");

    return (
      <div className="space-y-8 w-[400px]">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Default Variant</h3>
          <SearchInput
            variant="default"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Search default..."
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">V1 Variant</h3>
          <SearchInput
            variant="v1"
            value={v1Value}
            onChange={(e) => setV1Value(e.target.value)}
            placeholder="Search v1..."
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Mobile Variant</h3>
          <SearchInput
            variant="mobile"
            value={mobileValue}
            onChange={(e) => setMobileValue(e.target.value)}
            placeholder="Search mobile..."
          />
        </div>
      </div>
    );
  },
};

export const WithFocusHandlers: Story = {
  render: () => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [value, setValue] = React.useState("");

    return (
      <div className="space-y-4 w-[400px]">
        <SearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Focus me to see state"
        />
        <p className="text-sm">
          Status: {isFocused ? "Focused" : "Not focused"}
        </p>
      </div>
    );
  },
};

export const SearchInputMobileComponent: Story = {
  render: () => {
    const [value, setValue] = React.useState("");

    return (
      <div className="space-y-4 w-[400px]">
        <h3 className="text-sm font-medium">SearchInputMobile Component</h3>
        <SearchInputMobile
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search mobile component..."
        />
        <p className="text-sm text-muted-foreground">
          This is the separate mobile component
        </p>
      </div>
    );
  },
};

export const DifferentPlaceholders: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <SearchInput placeholder="Search users..." />
      <SearchInput placeholder="Find documents..." variant="v1" />
      <SearchInput placeholder="Type to search..." variant="mobile" />
      <SearchInputMobile placeholder="Quick search..." />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="border rounded-lg p-4 w-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">User Management</h2>
        <SearchInput
          placeholder="Search users..."
          className="w-[200px]"
        />
      </div>
      <div className="space-y-2">
        {["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown"].map((name) => (
          <div key={name} className="p-3 border rounded flex items-center justify-between">
            <span>{name}</span>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const WithResults: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const items = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];
    const filteredItems = items.filter(item =>
      item.toLowerCase().includes(value.toLowerCase())
    );

    return (
      <div className="w-[400px]">
        <SearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search fruits..."
          variant="v1"
        />
        {value && (
          <div className="mt-2 border rounded-lg p-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item} className="p-2 hover:bg-muted rounded cursor-pointer">
                  {item}
                </div>
              ))
            ) : (
              <div className="p-2 text-muted-foreground">No results found</div>
            )}
          </div>
        )}
      </div>
    );
  },
};

export const ResponsiveExample: Story = {
  render: () => {
    const [value, setValue] = React.useState("");

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Desktop View</h3>
          <SearchInput
            variant="v1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search on desktop..."
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Mobile View</h3>
          <SearchInput
            variant="mobile"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search on mobile..."
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Compact View</h3>
          <SearchInput
            variant="default"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Compact search..."
          />
        </div>
      </div>
    );
  },
};