import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/shared/ui";
import React from "react";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "editable"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Editable: Story = {
  args: {
    variant: "editable",
    children: "Editable",
    onDelete: () => console.log("Delete clicked"),
  },
};

export const AllVariants: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="editable" onDelete={() => console.log("Delete clicked")}>
        Editable
      </Badge>
    </div>
  ),
};

export const WithLongText: Story = {
  args: {
    children: "This is a badge with much longer text content",
  },
};

export const BadgeGroup: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div className="flex gap-2 flex-wrap max-w-[400px]">
      <Badge>React</Badge>
      <Badge>TypeScript</Badge>
      <Badge>Tailwind CSS</Badge>
      <Badge>Storybook</Badge>
      <Badge>Vite</Badge>
      <Badge>PWA</Badge>
      <Badge>PostgreSQL</Badge>
      <Badge>Drizzle ORM</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Badge variant="default">Pending</Badge>
        <Badge variant="secondary">In Progress</Badge>
        <Badge variant="destructive">Failed</Badge>
        <Badge variant="outline">Complete</Badge>
      </div>
      
      <div className="flex gap-2">
        <Badge variant="default">Draft</Badge>
        <Badge variant="secondary">Review</Badge>
        <Badge variant="destructive">Rejected</Badge>
        <Badge variant="outline">Published</Badge>
      </div>
    </div>
  ),
};

export const EditableBadges: Story = {
  args: {
    variant: "editable",
    children: "Skill",
  },
  render: () => {
    const [skills, setSkills] = React.useState([
      "JavaScript",
      "React",
      "Node.js",
      "Python",
      "SQL",
    ]);

    const removeSkill = (index: number) => {
      setSkills(skills.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {skills.map((skill, index) => (
            <Badge
              key={skill}
              variant="editable"
              onDelete={() => removeSkill(index)}
            >
              {skill}
            </Badge>
          ))}
        </div>
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">No skills added</p>
        )}
      </div>
    );
  },
};

export const CategoryBadges: Story = {
  args: {
    children: "Category",
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Programming Languages</h4>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">JavaScript</Badge>
          <Badge variant="secondary">Python</Badge>
          <Badge variant="secondary">Java</Badge>
          <Badge variant="secondary">Go</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Frameworks</h4>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">React</Badge>
          <Badge variant="outline">Vue</Badge>
          <Badge variant="outline">Angular</Badge>
          <Badge variant="outline">Svelte</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Tools</h4>
        <div className="flex gap-2 flex-wrap">
          <Badge>Git</Badge>
          <Badge>Docker</Badge>
          <Badge>Kubernetes</Badge>
          <Badge>Jenkins</Badge>
        </div>
      </div>
    </div>
  ),
};

export const BadgeWithCount: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div className="flex gap-2">
      <Badge>
        <span className="mr-1">Messages</span>
        <span className="ml-1 text-xs opacity-60">(12)</span>
      </Badge>
      <Badge variant="secondary">
        <span className="mr-1">Notifications</span>
        <span className="ml-1 text-xs opacity-60">(3)</span>
      </Badge>
      <Badge variant="destructive">
        <span className="mr-1">Errors</span>
        <span className="ml-1 text-xs opacity-60">(2)</span>
      </Badge>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    variant: "editable",
    children: "Tag",
  },
  render: () => {
    const [tags, setTags] = React.useState<string[]>([]);
    const [inputValue, setInputValue] = React.useState("");
    
    const addTag = () => {
      if (inputValue.trim() && !tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
        setInputValue("");
      }
    };
    
    const removeTag = (index: number) => {
      setTags(tags.filter((_, i) => i !== index));
    };
    
    return (
      <div className="space-y-4 w-[400px]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-1.5 text-sm border rounded-md"
          />
          <button
            onClick={addTag}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add
          </button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="editable"
              onDelete={() => removeTag(index)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground">No tags added yet</p>
        )}
      </div>
    );
  },
};

export const SizesExample: Story = {
  args: {
    children: "Badge",
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-20">Default:</span>
        <Badge>Badge</Badge>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-20">Custom:</span>
        <Badge className="text-[10px] px-2 py-0">Tiny</Badge>
        <Badge className="text-sm px-3 py-1">Small</Badge>
        <Badge className="text-base px-4 py-1.5">Large</Badge>
      </div>
    </div>
  ),
};