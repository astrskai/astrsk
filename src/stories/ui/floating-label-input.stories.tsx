import type { Meta, StoryObj } from "@storybook/react";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { Edit2 } from "lucide-react";
import React from "react";

const meta = {
  title: "UI/FloatingLabelInput",
  component: FloatingLabelInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "add", "edit", "guide"],
    },
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    readOnly: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof FloatingLabelInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email address",
  },
};

export const WithValue: Story = {
  args: {
    label: "Email address",
    defaultValue: "user@example.com",
  },
};

export const WithError: Story = {
  args: {
    label: "Email address",
    error: true,
    helpText: "Please enter a valid email address",
  },
};

export const WithHelpText: Story = {
  args: {
    label: "Username",
    helpText: "Choose a unique username",
  },
};

export const WithTooltip: Story = {
  args: {
    label: "API Key",
    tooltip: "Your API key can be found in the settings page of your dashboard",
  },
};

export const AddVariant: Story = {
  args: {
    label: "Add new item",
    variant: "add",
    buttonLabel: "Add",
    onButtonClick: () => alert("Add button clicked"),
  },
};

export const EditVariant: Story = {
  args: {
    label: "Edit item",
    variant: "edit",
    defaultValue: "Current value",
    buttonIcon: <Edit2 size={16} />,
    onButtonClick: () => alert("Edit button clicked"),
  },
};

export const GuideVariant: Story = {
  args: {
    label: "Guide text",
    variant: "guide",
    helpText: "0/100",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled input",
    disabled: true,
    defaultValue: "Cannot edit this",
  },
};

export const ReadOnly: Story = {
  args: {
    label: "Read only field",
    readOnly: true,
    defaultValue: "Click to copy",
  },
};

export const AllTypes: Story = {
  args: {
    label: "Default",
  },
  render: () => (
    <div className="space-y-6 w-[400px]">
      <FloatingLabelInput
        label="Text input"
        type="text"
      />
      <FloatingLabelInput
        label="Email input"
        type="email"
      />
      <FloatingLabelInput
        label="Password input"
        type="password"
      />
      <FloatingLabelInput
        label="Number input"
        type="number"
      />
      <FloatingLabelInput
        label="Tel input"
        type="tel"
      />
      <FloatingLabelInput
        label="URL input"
        type="url"
      />
    </div>
  ),
};

export const AllVariants: Story = {
  args: {
    label: "Default",
  },
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default variant</p>
        <FloatingLabelInput label="Default input" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Add variant</p>
        <FloatingLabelInput
          label="Add new tag"
          variant="add"
          buttonLabel="Add"
          onButtonClick={() => console.log("Add clicked")}
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Edit variant</p>
        <FloatingLabelInput
          label="Edit name"
          variant="edit"
          defaultValue="John Doe"
          buttonIcon={<Edit2 size={16} />}
          onButtonClick={() => console.log("Edit clicked")}
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Guide variant with character count</p>
        <FloatingLabelInput
          label="Description"
          variant="guide"
          helpText="0/200"
        />
      </div>
    </div>
  ),
};

export const States: Story = {
  args: {
    label: "Default",
  },
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Empty state</p>
        <FloatingLabelInput label="Empty input" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Filled state</p>
        <FloatingLabelInput label="Filled input" defaultValue="Some content" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Error state</p>
        <FloatingLabelInput
          label="Error input"
          error
          helpText="This field is required"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Disabled state</p>
        <FloatingLabelInput
          label="Disabled input"
          disabled
          defaultValue="Cannot edit"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">With tooltip</p>
        <FloatingLabelInput
          label="With help"
          tooltip="This is additional help information that appears on hover"
        />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    label: "Default",
  },
  render: () => {
    const [value, setValue] = React.useState("");
    const [items, setItems] = React.useState<string[]>([]);

    const handleAdd = () => {
      if (value.trim()) {
        setItems([...items, value]);
        setValue("");
      }
    };

    return (
      <div className="space-y-4 w-[400px]">
        <FloatingLabelInput
          label="Add item to list"
          variant="add"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onButtonClick={handleAdd}
          buttonLabel="Add"
          helpText={`${value.length}/50 characters`}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleAdd();
            }
          }}
        />
        
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Items added:</p>
            <ul className="list-disc list-inside space-y-1">
              {items.map((item, index) => (
                <li key={index} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

export const FormExample: Story = {
  args: {
    label: "Default",
  },
  render: () => (
    <div className="space-y-6 w-[500px]">
      <h3 className="text-lg font-semibold">User Profile</h3>
      
      <FloatingLabelInput
        label="Full Name"
        defaultValue="John Doe"
        variant="edit"
        buttonIcon={<Edit2 size={16} />}
        onButtonClick={() => console.log("Edit name")}
      />
      
      <FloatingLabelInput
        label="Email"
        type="email"
        defaultValue="john.doe@example.com"
        readOnly
        tooltip="Contact support to change your email address"
      />
      
      <FloatingLabelInput
        label="Bio"
        variant="guide"
        helpText="0/200"
      />
      
      <FloatingLabelInput
        label="Website"
        type="url"
        helpText="Include https://"
      />
      
      <FloatingLabelInput
        label="API Token"
        defaultValue="sk-1234567890abcdef"
        readOnly
        tooltip="Click to copy your API token"
      />
    </div>
  ),
};