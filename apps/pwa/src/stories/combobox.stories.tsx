import type { Meta, StoryObj } from "@storybook/react";
import { Combobox, type ComboboxOption } from "@/components-v2/combobox";
import React from "react";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const simpleOptions: ComboboxOption[] = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
  { label: "Date", value: "date" },
  { label: "Elderberry", value: "elderberry" },
];

const groupedOptions: ComboboxOption[] = [
  {
    label: "Fruits",
    value: "fruits",
    sub: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Orange", value: "orange" },
    ],
  },
  {
    label: "Vegetables",
    value: "vegetables",
    sub: [
      { label: "Carrot", value: "carrot" },
      { label: "Broccoli", value: "broccoli" },
      { label: "Spinach", value: "spinach" },
    ],
  },
  {
    label: "Proteins",
    value: "proteins",
    sub: [
      { label: "Chicken", value: "chicken" },
      { label: "Beef", value: "beef" },
      { label: "Fish", value: "fish" },
    ],
  },
];

export const Default: Story = {
  args: {
    options: simpleOptions,
    triggerPlaceholder: "Select a fruit",
    searchPlaceholder: "Search fruits...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Favorite Fruit",
    options: simpleOptions,
    triggerPlaceholder: "Choose your favorite",
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>("");

    return (
      <div className="space-y-4">
        <Combobox
          options={simpleOptions}
          value={value}
          onValueChange={setValue}
          triggerPlaceholder="Select a fruit"
        />
        <p className="text-sm text-muted-foreground">
          Selected value: {value || "none"}
        </p>
      </div>
    );
  },
};

export const GroupedItems: Story = {
  args: {
    options: groupedOptions,
    triggerPlaceholder: "Select an item",
    searchPlaceholder: "Search items...",
  },
};

export const WithKeywords: Story = {
  args: {
    options: [
      { label: "JavaScript", value: "js", keywords: ["js", "node", "frontend"] },
      { label: "TypeScript", value: "ts", keywords: ["ts", "typed", "frontend"] },
      { label: "Python", value: "python", keywords: ["py", "snake", "backend"] },
      { label: "Go", value: "go", keywords: ["golang", "backend"] },
      { label: "Rust", value: "rust", keywords: ["rs", "systems"] },
    ],
    triggerPlaceholder: "Select a language",
    searchPlaceholder: "Search by name or keyword...",
  },
};

export const DisabledState: Story = {
  args: {
    options: simpleOptions,
    disabled: true,
    value: "banana",
    triggerPlaceholder: "Select a fruit",
  },
};

export const NoSearch: Story = {
  args: {
    options: simpleOptions,
    searchable: false,
    triggerPlaceholder: "Select without search",
  },
};

export const CustomSearchEmpty: Story = {
  args: {
    options: simpleOptions,
    searchEmpty: (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No results found</p>
        <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
      </div>
    ),
    searchPlaceholder: "Try searching for 'xyz'...",
  },
};

const aiModelOptions: ComboboxOption[] = [
  {
    label: "OpenAI GPT",
    value: "openai-gpt",
    sub: [
      { label: "GPT-4o", value: "gpt-4o" },
      { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
      { label: "GPT-4", value: "gpt-4" },
      { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
    ],
  },
  {
    label: "Anthropic Claude",
    value: "anthropic-claude",
    sub: [
      { label: "Claude 3 Opus", value: "claude-3-opus-20240229" },
      { label: "Claude 3 Sonnet", value: "claude-3-sonnet-20240229" },
      { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
      { label: "Claude 2.1", value: "claude-2.1" },
    ],
  },
  {
    label: "Google",
    value: "google",
    sub: [
      { label: "Gemini Pro", value: "gemini-pro" },
      { label: "Gemini Pro Vision", value: "gemini-pro-vision" },
      { label: "PaLM 2", value: "palm-2" },
    ],
  },
];

export const AIModelSelection: Story = {
  args: {
    label: "Select AI Model",
    options: aiModelOptions,
    triggerPlaceholder: "Choose a model",
    searchPlaceholder: "Search models (try 'GPT' or 'Claude')...",
  },
};

export const MobileVariant: Story = {
  args: {
    options: simpleOptions,
    forceMobile: true,
    label: "Select Fruit",
    triggerPlaceholder: "Choose a fruit",
  },
};

export const DesktopVsMobile: Story = {
  render: () => {
    const [desktopValue, setDesktopValue] = React.useState<string>("");
    const [mobileValue, setMobileValue] = React.useState<string>("");

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Desktop Version</h3>
          <Combobox
            options={simpleOptions}
            value={desktopValue}
            onValueChange={setDesktopValue}
            forceMobile={false}
            triggerPlaceholder="Desktop combobox"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Mobile Version</h3>
          <Combobox
            options={simpleOptions}
            value={mobileValue}
            onValueChange={setMobileValue}
            forceMobile={true}
            label="Mobile Selector"
            triggerPlaceholder="Mobile combobox"
          />
        </div>
      </div>
    );
  },
};

export const LongList: Story = {
  args: {
    options: Array.from({ length: 50 }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: `option-${i + 1}`,
    })),
    triggerPlaceholder: "Select from many options",
    searchPlaceholder: "Search through 50 options...",
  },
};

export const ComplexGroups: Story = {
  args: {
    options: [
      {
        label: "Europe",
        value: "europe",
        sub: [
          { label: "France", value: "fr" },
          { label: "Germany", value: "de" },
          { label: "Spain", value: "es" },
          { label: "Italy", value: "it" },
        ],
      },
      {
        label: "North America",
        value: "north-america",
        sub: [
          { label: "United States", value: "us" },
          { label: "Canada", value: "ca" },
          { label: "Mexico", value: "mx" },
        ],
      },
      {
        label: "Asia",
        value: "asia",
        sub: [
          { label: "Japan", value: "jp" },
          { label: "China", value: "cn" },
          { label: "South Korea", value: "kr" },
          { label: "India", value: "in" },
        ],
      },
      {
        label: "South America",
        value: "south-america",
        sub: [
          { label: "Brazil", value: "br" },
          { label: "Argentina", value: "ar" },
          { label: "Chile", value: "cl" },
        ],
      },
    ],
    triggerPlaceholder: "Select a country",
    searchPlaceholder: "Search countries...",
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      name: "",
      country: "",
      language: "",
    });

    return (
      <form className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Country</label>
          <Combobox
            options={[
              { label: "United States", value: "us" },
              { label: "United Kingdom", value: "uk" },
              { label: "Canada", value: "ca" },
              { label: "Australia", value: "au" },
            ]}
            value={formData.country}
            onValueChange={(value) => setFormData({ ...formData, country: value })}
            triggerPlaceholder="Select your country"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Preferred Language</label>
          <Combobox
            options={[
              { label: "English", value: "en" },
              { label: "Spanish", value: "es" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
            ]}
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
            triggerPlaceholder="Select language"
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Form Data</h3>
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </form>
    );
  },
};

export const DynamicOptions: Story = {
  render: () => {
    const [category, setCategory] = React.useState<string>("");
    const [item, setItem] = React.useState<string>("");

    const categoryOptions: ComboboxOption[] = [
      { label: "Electronics", value: "electronics" },
      { label: "Clothing", value: "clothing" },
      { label: "Books", value: "books" },
    ];

    const itemOptions: Record<string, ComboboxOption[]> = {
      electronics: [
        { label: "Laptop", value: "laptop" },
        { label: "Phone", value: "phone" },
        { label: "Tablet", value: "tablet" },
      ],
      clothing: [
        { label: "Shirt", value: "shirt" },
        { label: "Pants", value: "pants" },
        { label: "Shoes", value: "shoes" },
      ],
      books: [
        { label: "Fiction", value: "fiction" },
        { label: "Non-fiction", value: "non-fiction" },
        { label: "Science", value: "science" },
      ],
    };

    return (
      <div className="space-y-4">
        <Combobox
          label="Category"
          options={categoryOptions}
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            setItem(""); // Reset item when category changes
          }}
          triggerPlaceholder="Select a category"
        />

        <Combobox
          label="Item"
          options={itemOptions[category] || []}
          value={item}
          onValueChange={setItem}
          triggerPlaceholder={category ? "Select an item" : "Select a category first"}
          disabled={!category}
        />

        {item && (
          <p className="text-sm text-muted-foreground">
            Selected: {category} → {item}
          </p>
        )}
      </div>
    );
  },
};