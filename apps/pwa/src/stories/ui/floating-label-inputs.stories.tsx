import type { Meta, StoryObj } from "@storybook/react";
import { FloatingLabelInputs } from "@/shared/ui/floating-label-inputs";
import React from "react";

const meta = {
  title: "UI/FloatingLabelInputs",
  component: FloatingLabelInputs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    error: {
      control: "boolean",
    },
    warning: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    maxBadgeCount: {
      control: "number",
    },
  },
} satisfies Meta<typeof FloatingLabelInputs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Tags",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>([]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Tags"
          values={values}
          onValuesChange={setValues}
        />
      </div>
    );
  },
};

export const WithInitialValues: Story = {
  args: {
    label: "Technologies",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>([
      "React",
      "TypeScript",
      "Tailwind CSS",
    ]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Technologies"
          values={values}
          onValuesChange={setValues}
        />
      </div>
    );
  },
};

export const WithHelpText: Story = {
  args: {
    label: "Keywords",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>([]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Keywords"
          values={values}
          onValuesChange={setValues}
          helpText="Add up to 5 keywords for better search results"
        />
      </div>
    );
  },
};

export const WithError: Story = {
  args: {
    label: "Required Tags",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>([]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Required Tags"
          values={values}
          onValuesChange={setValues}
          error
          helpText="At least one tag is required"
        />
      </div>
    );
  },
};

export const WithWarning: Story = {
  args: {
    label: "Tags",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>(["tag1", "tag2", "tag3", "tag4"]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Tags"
          values={values}
          onValuesChange={setValues}
          warning
          helpText="You're approaching the maximum limit of 5 tags"
          maxBadgeCount={5}
        />
      </div>
    );
  },
};

export const WithMaxLimit: Story = {
  args: {
    label: "Categories",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>([]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Categories"
          values={values}
          onValuesChange={setValues}
          maxBadgeCount={3}
          helpText={`${values.length}/3 categories`}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Tags",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [values, setValues] = React.useState<string[]>(["Fixed", "Cannot", "Edit"]);
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Disabled Tags"
          values={values}
          onValuesChange={setValues}
          disabled
        />
      </div>
    );
  },
};

export const EmailList: Story = {
  args: {
    label: "Email addresses",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [emails, setEmails] = React.useState<string[]>([]);
    const [error, setError] = React.useState(false);
    
    const validateEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    
    const handleEmailsChange = (newEmails: string[]) => {
      const invalidEmails = newEmails.filter(email => !validateEmail(email));
      setError(invalidEmails.length > 0);
      setEmails(newEmails);
    };
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Email addresses"
          values={emails}
          onValuesChange={handleEmailsChange}
          type="email"
          inputPlaceholder="name@example.com"
          error={error}
          helpText={error ? "Some email addresses are invalid" : "Add team member emails"}
        />
      </div>
    );
  },
};

export const SkillsExample: Story = {
  args: {
    label: "Skills",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [skills, setSkills] = React.useState<string[]>([
      "JavaScript",
      "Python",
      "SQL",
    ]);
    
    const maxSkills = 10;
    const skillCount = skills.length;
    
    return (
      <div className="w-[500px]">
        <FloatingLabelInputs
          label="Skills"
          values={skills}
          onValuesChange={setSkills}
          maxBadgeCount={maxSkills}
          helpText={`${skillCount}/${maxSkills} skills added`}
          warning={skillCount >= 8}
        />
      </div>
    );
  },
};

export const InteractiveExample: Story = {
  args: {
    label: "Project tags",
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [tags, setTags] = React.useState<string[]>([]);
    const [history, setHistory] = React.useState<string[]>([]);
    
    const handleTagsChange = (newTags: string[]) => {
      if (newTags.length > tags.length) {
        // Tag added
        const added = newTags[newTags.length - 1];
        setHistory([...history, `Added: ${added}`]);
      } else if (newTags.length < tags.length) {
        // Tag removed
        const removed = tags.find(tag => !newTags.includes(tag));
        setHistory([...history, `Removed: ${removed}`]);
      }
      setTags(newTags);
    };
    
    return (
      <div className="space-y-4 w-[500px]">
        <FloatingLabelInputs
          label="Project tags"
          values={tags}
          onValuesChange={handleTagsChange}
          helpText="Press Enter to add a tag"
        />
        
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">History:</p>
            <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {history.map((entry, index) => (
                <li key={index} className="text-muted-foreground">{entry}</li>
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
    values: [],
    onValuesChange: () => {},
  },
  render: () => {
    const [interests, setInterests] = React.useState<string[]>([]);
    const [languages, setLanguages] = React.useState<string[]>(["English"]);
    const [certifications, setCertifications] = React.useState<string[]>([]);
    
    return (
      <div className="space-y-6 w-[500px]">
        <h3 className="text-lg font-semibold">Professional Profile</h3>
        
        <FloatingLabelInputs
          label="Areas of Interest"
          values={interests}
          onValuesChange={setInterests}
          helpText="Add your professional interests"
        />
        
        <FloatingLabelInputs
          label="Languages"
          values={languages}
          onValuesChange={setLanguages}
          helpText="Languages you speak fluently"
        />
        
        <FloatingLabelInputs
          label="Certifications"
          values={certifications}
          onValuesChange={setCertifications}
          maxBadgeCount={5}
          helpText={`${certifications.length}/5 certifications`}
          warning={certifications.length >= 4}
        />
      </div>
    );
  },
};