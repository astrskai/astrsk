import type { Meta, StoryObj } from "@storybook/react";
import { FloatingLabelSelect } from "@/components-v2/ui/floating-label-select";
import { SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/shared/ui/select";
import React from "react";

const meta = {
  title: "UI/FloatingLabelSelect",
  component: FloatingLabelSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof FloatingLabelSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Select Option",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect label="Select Option">
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </FloatingLabelSelect>
    </div>
  ),
};

export const WithDefaultValue: Story = {
  args: {
    label: "Country",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect label="Country" defaultValue="us">
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
      </FloatingLabelSelect>
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: "Required Field",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect
        label="Required Field"
        error
        helpText="Please select an option"
      >
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </FloatingLabelSelect>
    </div>
  ),
};

export const WithHelpText: Story = {
  args: {
    label: "Time Zone",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect
        label="Time Zone"
        helpText="Select your local time zone"
      >
        <SelectItem value="pst">Pacific Standard Time</SelectItem>
        <SelectItem value="mst">Mountain Standard Time</SelectItem>
        <SelectItem value="cst">Central Standard Time</SelectItem>
        <SelectItem value="est">Eastern Standard Time</SelectItem>
      </FloatingLabelSelect>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Disabled Select",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect
        label="Disabled Select"
        disabled
        defaultValue="option1"
      >
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </FloatingLabelSelect>
    </div>
  ),
};

export const WithGroups: Story = {
  args: {
    label: "Select a food",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect label="Programming Language">
        <SelectGroup>
          <SelectLabel>Frontend</SelectLabel>
          <SelectItem value="javascript">JavaScript</SelectItem>
          <SelectItem value="typescript">TypeScript</SelectItem>
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="vue">Vue</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Backend</SelectLabel>
          <SelectItem value="python">Python</SelectItem>
          <SelectItem value="java">Java</SelectItem>
          <SelectItem value="go">Go</SelectItem>
          <SelectItem value="rust">Rust</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Database</SelectLabel>
          <SelectItem value="postgresql">PostgreSQL</SelectItem>
          <SelectItem value="mysql">MySQL</SelectItem>
          <SelectItem value="mongodb">MongoDB</SelectItem>
        </SelectGroup>
      </FloatingLabelSelect>
    </div>
  ),
};

export const LongList: Story = {
  args: {
    label: "Select a country",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="w-[300px]">
      <FloatingLabelSelect label="Select State">
        <SelectItem value="al">Alabama</SelectItem>
        <SelectItem value="ak">Alaska</SelectItem>
        <SelectItem value="az">Arizona</SelectItem>
        <SelectItem value="ar">Arkansas</SelectItem>
        <SelectItem value="ca">California</SelectItem>
        <SelectItem value="co">Colorado</SelectItem>
        <SelectItem value="ct">Connecticut</SelectItem>
        <SelectItem value="de">Delaware</SelectItem>
        <SelectItem value="fl">Florida</SelectItem>
        <SelectItem value="ga">Georgia</SelectItem>
        <SelectItem value="hi">Hawaii</SelectItem>
        <SelectItem value="id">Idaho</SelectItem>
        <SelectItem value="il">Illinois</SelectItem>
        <SelectItem value="in">Indiana</SelectItem>
        <SelectItem value="ia">Iowa</SelectItem>
        <SelectItem value="ks">Kansas</SelectItem>
        <SelectItem value="ky">Kentucky</SelectItem>
        <SelectItem value="la">Louisiana</SelectItem>
        <SelectItem value="me">Maine</SelectItem>
        <SelectItem value="md">Maryland</SelectItem>
      </FloatingLabelSelect>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    label: "Favorite Color",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => {
    const [value, setValue] = React.useState("");
    
    return (
      <div className="space-y-4 w-[300px]">
        <FloatingLabelSelect
          label="Favorite Color"
          value={value}
          onValueChange={setValue}
        >
          <SelectItem value="red">Red</SelectItem>
          <SelectItem value="green">Green</SelectItem>
          <SelectItem value="blue">Blue</SelectItem>
          <SelectItem value="yellow">Yellow</SelectItem>
          <SelectItem value="purple">Purple</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </FloatingLabelSelect>
        
        {value && (
          <p className="text-sm text-muted-foreground">
            You selected: <span className="font-medium">{value}</span>
          </p>
        )}
      </div>
    );
  },
};

export const AllStates: Story = {
  args: {
    label: "Select Option",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => (
    <div className="space-y-6 w-[300px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Empty state</p>
        <FloatingLabelSelect label="Select Option">
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </FloatingLabelSelect>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Selected state</p>
        <FloatingLabelSelect label="Select Option" defaultValue="option2">
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </FloatingLabelSelect>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Error state</p>
        <FloatingLabelSelect
          label="Select Option"
          error
          helpText="This field is required"
        >
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </FloatingLabelSelect>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Disabled state</p>
        <FloatingLabelSelect
          label="Select Option"
          disabled
          defaultValue="option1"
        >
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </FloatingLabelSelect>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  args: {
    label: "Country",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => {
    const [country, setCountry] = React.useState("");
    const [language, setLanguage] = React.useState("");
    const [timezone, setTimezone] = React.useState("");
    
    return (
      <div className="space-y-6 w-[400px]">
        <h3 className="text-lg font-semibold">Location Settings</h3>
        
        <FloatingLabelSelect
          label="Country"
          value={country}
          onValueChange={setCountry}
          helpText="Select your country of residence"
        >
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="au">Australia</SelectItem>
          <SelectItem value="de">Germany</SelectItem>
          <SelectItem value="fr">France</SelectItem>
          <SelectItem value="jp">Japan</SelectItem>
          <SelectItem value="kr">South Korea</SelectItem>
        </FloatingLabelSelect>
        
        <FloatingLabelSelect
          label="Language"
          value={language}
          onValueChange={setLanguage}
          error={!language}
          helpText={!language ? "Please select a language" : undefined}
        >
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
          <SelectItem value="fr">French</SelectItem>
          <SelectItem value="de">German</SelectItem>
          <SelectItem value="ja">Japanese</SelectItem>
          <SelectItem value="ko">Korean</SelectItem>
          <SelectItem value="zh">Chinese</SelectItem>
        </FloatingLabelSelect>
        
        <FloatingLabelSelect
          label="Time Zone"
          value={timezone}
          onValueChange={setTimezone}
        >
          <SelectGroup>
            <SelectLabel>Americas</SelectLabel>
            <SelectItem value="pst">Pacific Time (PST)</SelectItem>
            <SelectItem value="mst">Mountain Time (MST)</SelectItem>
            <SelectItem value="cst">Central Time (CST)</SelectItem>
            <SelectItem value="est">Eastern Time (EST)</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
            <SelectItem value="cet">Central European Time (CET)</SelectItem>
            <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
            <SelectItem value="kst">Korea Standard Time (KST)</SelectItem>
            <SelectItem value="cst-china">China Standard Time (CST)</SelectItem>
          </SelectGroup>
        </FloatingLabelSelect>
      </div>
    );
  },
};

export const DynamicOptions: Story = {
  args: {
    label: "Category",
    children: <></>,
    value: "",
    onValueChange: () => {},
  },
  render: () => {
    const [category, setCategory] = React.useState("");
    const [subcategory, setSubcategory] = React.useState("");
    
    const subcategories: Record<string, { value: string; label: string }[]> = {
      electronics: [
        { value: "phones", label: "Phones" },
        { value: "laptops", label: "Laptops" },
        { value: "tablets", label: "Tablets" },
        { value: "accessories", label: "Accessories" },
      ],
      clothing: [
        { value: "mens", label: "Men's Clothing" },
        { value: "womens", label: "Women's Clothing" },
        { value: "kids", label: "Kids' Clothing" },
        { value: "shoes", label: "Shoes" },
      ],
      home: [
        { value: "furniture", label: "Furniture" },
        { value: "decor", label: "Home Decor" },
        { value: "kitchen", label: "Kitchen" },
        { value: "bedding", label: "Bedding" },
      ],
    };
    
    React.useEffect(() => {
      setSubcategory("");
    }, [category]);
    
    return (
      <div className="space-y-6 w-[400px]">
        <FloatingLabelSelect
          label="Category"
          value={category}
          onValueChange={setCategory}
        >
          <SelectItem value="electronics">Electronics</SelectItem>
          <SelectItem value="clothing">Clothing</SelectItem>
          <SelectItem value="home">Home & Garden</SelectItem>
        </FloatingLabelSelect>
        
        {category && (
          <FloatingLabelSelect
            label="Subcategory"
            value={subcategory}
            onValueChange={setSubcategory}
            helpText="Select a subcategory"
          >
            {subcategories[category]?.map((sub) => (
              <SelectItem key={sub.value} value={sub.value}>
                {sub.label}
              </SelectItem>
            ))}
          </FloatingLabelSelect>
        )}
      </div>
    );
  },
};