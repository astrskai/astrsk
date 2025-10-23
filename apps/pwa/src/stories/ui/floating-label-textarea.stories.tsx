import type { Meta, StoryObj } from "@storybook/react";
import { FloatingLabelTextarea } from "@/shared/ui";
import React from "react";

const meta = {
  title: "UI/FloatingLabelTextarea",
  component: FloatingLabelTextarea,
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
    rows: {
      control: "number",
    },
  },
} satisfies Meta<typeof FloatingLabelTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Description",
  },
};

export const WithValue: Story = {
  args: {
    label: "Description",
    value: "This is a sample description text that shows how the floating label appears when there is content in the textarea.",
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: "Comments",
    placeholder: "Share your thoughts...",
  },
};

export const WithError: Story = {
  args: {
    label: "Required Field",
    error: true,
    helpText: "This field is required",
  },
};

export const WithHelpText: Story = {
  args: {
    label: "Bio",
    helpText: "Tell us about yourself (max 500 characters)",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    disabled: true,
    value: "This field cannot be edited",
  },
};

export const CustomRows: Story = {
  args: {
    label: "Extended Content",
    rows: 8,
    placeholder: "This textarea has 8 rows...",
  },
};

export const ReadOnly: Story = {
  args: {
    label: "Read Only Content",
    readOnly: true,
    value: `This is read-only content.
You can select and copy it, but you cannot edit it.

This is useful for displaying non-editable information.`,
  },
};

export const WithMaxLength: Story = {
  args: {
    label: "Limited Input",
    value: "",
    onChange: () => {},
  },
  render: () => {
    const [value, setValue] = React.useState("");
    const maxLength = 200;

    return (
      <div className="w-[500px]">
        <FloatingLabelTextarea
          label="Limited Input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          helpText={`${value.length}/${maxLength} characters`}
        />
      </div>
    );
  },
};

export const AllStates: Story = {
  args: {
    label: "Empty textarea",
    value: "",
    onChange: () => {},
  },
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Empty state</p>
        <FloatingLabelTextarea label="Empty textarea" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Filled state</p>
        <FloatingLabelTextarea
          label="Filled textarea"
          value="This textarea contains some content"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Error state</p>
        <FloatingLabelTextarea
          label="Error textarea"
          error
          helpText="Please fill out this field"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Disabled state</p>
        <FloatingLabelTextarea
          label="Disabled textarea"
          disabled
          value="Cannot edit this content"
        />
      </div>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    label: "Article Content",
    value: `This is a very long text to demonstrate how the floating label textarea handles extensive content that may require scrolling.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

The textarea has a maximum height of 360px and will show scrollbars when the content exceeds this height. The floating label remains fixed at the top while you scroll through the content.

This behavior ensures that users can always see what field they're editing while having access to scroll through longer content when needed.`,
  },
};

export const Interactive: Story = {
  args: {
    label: "Write your story",
    value: "",
    onChange: () => {},
  },
  render: () => {
    const [value, setValue] = React.useState("");
    const [wordCount, setWordCount] = React.useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setValue(text);
      setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
    };

    return (
      <div className="w-[500px]">
        <FloatingLabelTextarea
          label="Write your story"
          value={value}
          onChange={handleChange}
          rows={6}
          placeholder="Start typing your story..."
          helpText={`${wordCount} words • ${value.length} characters`}
        />
      </div>
    );
  },
};

export const FormExample: Story = {
  args: {
    label: "Overall Experience",
    value: "",
    onChange: () => {},
  },
  render: () => {
    const [feedback, setFeedback] = React.useState("");
    const [experience, setExperience] = React.useState("");
    const [suggestions, setSuggestions] = React.useState("");

    return (
      <div className="space-y-6 w-[500px]">
        <h3 className="text-lg font-semibold">Product Feedback Form</h3>
        
        <FloatingLabelTextarea
          label="Overall Experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={3}
          helpText="How has your experience been with our product?"
        />
        
        <FloatingLabelTextarea
          label="Detailed Feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          helpText="Please provide specific details about your experience"
          error={feedback.length === 0}
        />
        
        <FloatingLabelTextarea
          label="Suggestions for Improvement"
          value={suggestions}
          onChange={(e) => setSuggestions(e.target.value)}
          rows={4}
          placeholder="What features would you like to see?"
          helpText="Optional: Share your ideas"
        />
      </div>
    );
  },
};

export const ValidationExample: Story = {
  args: {
    label: "Project Description",
    value: "",
    onChange: () => {},
  },
  render: () => {
    const [value, setValue] = React.useState("");
    const minLength = 50;
    const maxLength = 500;
    
    const isValid = value.length >= minLength && value.length <= maxLength;
    const error = value.length > 0 && !isValid;
    
    let helpText = `${value.length}/${maxLength} characters`;
    if (value.length < minLength && value.length > 0) {
      helpText = `Minimum ${minLength} characters required (${minLength - value.length} more needed)`;
    }

    return (
      <div className="w-[500px]">
        <FloatingLabelTextarea
          label="Project Description"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={error}
          helpText={helpText}
          maxLength={maxLength}
          rows={5}
        />
      </div>
    );
  },
};