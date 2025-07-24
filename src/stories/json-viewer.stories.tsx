import type { Meta, StoryObj } from "@storybook/react";
import { JsonViewer } from "@/components-v2/json-viewer";
import React from "react";
import { Button } from "@/components-v2/ui/button";

const meta = {
  title: "Components/JsonViewer",
  component: JsonViewer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleJson = JSON.stringify({
  name: "John Doe",
  age: 30,
  active: true,
  email: "john@example.com",
  address: {
    street: "123 Main St",
    city: "New York",
    zipCode: "10001",
  },
  hobbies: ["reading", "gaming", "coding"],
  metadata: null,
}, null, 2);

export const Default: Story = {
  args: {
    json: sampleJson,
  },
};

export const ComplexObject: Story = {
  args: {
    json: JSON.stringify({
      id: "user-123",
      profile: {
        firstName: "Jane",
        lastName: "Smith",
        age: 28,
        verified: true,
        joinedAt: "2024-01-15T10:30:00Z",
        settings: {
          theme: "dark",
          notifications: {
            email: true,
            push: false,
            sms: null,
          },
          privacy: {
            profileVisible: true,
            showEmail: false,
          },
        },
      },
      stats: {
        posts: 142,
        followers: 1523,
        following: 342,
        engagement: 0.725,
      },
      tags: ["premium", "verified", "content-creator"],
      lastSeen: null,
    }, null, 2),
  },
};

export const ArrayOfObjects: Story = {
  args: {
    json: JSON.stringify([
      {
        id: 1,
        task: "Complete documentation",
        completed: false,
        priority: "high",
      },
      {
        id: 2,
        task: "Review pull requests",
        completed: true,
        priority: "medium",
      },
      {
        id: 3,
        task: "Deploy to production",
        completed: false,
        priority: "critical",
      },
    ], null, 2),
  },
};

export const SimpleValues: Story = {
  args: {
    json: JSON.stringify({
      string: "Hello, World!",
      number: 42,
      float: 3.14159,
      boolean: false,
      null: null,
      emptyString: "",
      zero: 0,
      negativeNumber: -100,
    }, null, 2),
  },
};

export const InvalidJson: Story = {
  args: {
    json: "{ invalid json: true, missing quotes }",
  },
};

export const EmptyObject: Story = {
  args: {
    json: "{}",
  },
};

export const EmptyArray: Story = {
  args: {
    json: "[]",
  },
};

export const NestedArrays: Story = {
  args: {
    json: JSON.stringify({
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      mixed: [
        "string",
        123,
        true,
        null,
        { nested: "object" },
        ["nested", "array"],
      ],
    }, null, 2),
  },
};

export const ApiResponse: Story = {
  args: {
    json: JSON.stringify({
      status: "success",
      code: 200,
      data: {
        users: [
          {
            id: "usr_001",
            name: "Alice Johnson",
            role: "admin",
            permissions: ["read", "write", "delete"],
          },
          {
            id: "usr_002",
            name: "Bob Smith",
            role: "user",
            permissions: ["read"],
          },
        ],
        pagination: {
          page: 1,
          perPage: 20,
          total: 2,
          hasMore: false,
        },
      },
      timestamp: "2024-03-15T14:30:00Z",
    }, null, 2),
  },
};

export const MinifiedJson: Story = {
  args: {
    json: '{"name":"Compact","items":[1,2,3],"active":true,"meta":null}',
  },
};

export const InteractiveExample: Story = {
  args: {
    json: "",
  },
  render: () => {
    const [jsonInput, setJsonInput] = React.useState(sampleJson);
    const [displayJson, setDisplayJson] = React.useState(sampleJson);
    const [error, setError] = React.useState("");

    const handleFormat = () => {
      try {
        const parsed = JSON.parse(jsonInput);
        const formatted = JSON.stringify(parsed, null, 2);
        setDisplayJson(formatted);
        setJsonInput(formatted);
        setError("");
      } catch (e) {
        setError("Invalid JSON: " + (e as Error).message);
      }
    };

    const handleMinify = () => {
      try {
        const parsed = JSON.parse(jsonInput);
        const minified = JSON.stringify(parsed);
        setDisplayJson(minified);
        setJsonInput(minified);
        setError("");
      } catch (e) {
        setError("Invalid JSON: " + (e as Error).message);
      }
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">JSON Input:</label>
          <textarea
            className="w-full h-40 p-3 font-mono text-sm border rounded-md"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Enter JSON here..."
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleFormat}>Format</Button>
          <Button onClick={handleMinify} variant="outline">Minify</Button>
          <Button 
            onClick={() => setDisplayJson(jsonInput)} 
            variant="outline"
          >
            Update View
          </Button>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        
        <div className="border rounded-md p-4 bg-muted/50">
          <JsonViewer json={displayJson} />
        </div>
      </div>
    );
  },
};

export const DarkMode: Story = {
  args: {
    json: sampleJson,
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-6 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const LongContent: Story = {
  args: {
    json: JSON.stringify({
      description: "This is a very long string that demonstrates how the JSON viewer handles lengthy content. It should wrap appropriately and maintain readability even with extended text values.",
      data: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
        active: Math.random() > 0.5,
      })),
    }, null, 2),
  },
};

export const SpecialCharacters: Story = {
  args: {
    json: JSON.stringify({
      unicode: "Hello 世界! 🌍",
      escaped: "Line 1\\nLine 2\\tTabbed",
      quotes: 'She said "Hello!"',
      backslash: "C:\\\\Users\\\\Documents",
      html: "<div class=\"container\">Content</div>",
      regex: "^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]{2,}$",
    }, null, 2),
  },
};