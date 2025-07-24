import type { Meta, StoryObj } from "@storybook/react";
import { CodeEditor } from "@/components-v2/code-editor";
import React from "react";
import { Button } from "@/components-v2/ui/button";

const meta = {
  title: "Components/CodeEditor",
  component: CodeEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CodeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const liquidTemplate = `{%- comment -%}
  This is a sample Liquid template
{%- endcomment -%}

<h1>Welcome, {{ user.name }}!</h1>

{% if user.is_premium %}
  <p>Thank you for being a premium member!</p>
{% else %}
  <p>Consider upgrading to premium for more features.</p>
{% endif %}

{% for product in products %}
  <div class="product">
    <h3>{{ product.title }}</h3>
    <p>Price: {{ product.price | currency }}</p>
  </div>
{% endfor %}

<<<History Message>>>
Previous conversation context goes here...
<<<History Message>>>`;

export const Default: Story = {
  args: {
    value: liquidTemplate,
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const WithErrors: Story = {
  args: {
    value: "{% if user.name %}\n  Missing endif statement\n",
    onChange: (value) => console.log("Value changed:", value),
    errorLines: [
      {
        error: "Unexpected end of template. Expected 'endif'",
        line: 3,
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const DarkTheme: Story = {
  args: {
    value: liquidTemplate,
    options: {
      theme: "astrsk-theme-dark",
    },
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-4 h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const CustomHeight: Story = {
  args: {
    value: "{{ greeting }}\n\n{% assign name = 'World' %}\nHello, {{ name }}!",
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="h-[200px]">
        <Story />
      </div>
    ),
  ],
};

export const WithLineNumbers: Story = {
  args: {
    value: liquidTemplate,
    options: {
      lineNumbers: "on",
      rulers: [80, 120],
    },
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const ReadOnly: Story = {
  args: {
    value: "{% comment %} This editor is read-only {% endcomment %}\n{{ content }}",
    options: {
      readOnly: true,
    },
  },
};

export const WithVariables: Story = {
  args: {
    value: "Type {{ to see available variables\n\n// Variables are automatically suggested when typing {{",
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const MinimapEnabled: Story = {
  args: {
    value: liquidTemplate,
    options: {
      minimap: { enabled: true },
    },
    onChange: (value) => console.log("Value changed:", value),
  },
};

export const InteractiveExample: Story = {
  render: () => {
    const [value, setValue] = React.useState(liquidTemplate);
    const [errors, setErrors] = React.useState<Array<{ error: string; line: number }>>([]);
    const [_variables] = React.useState([
      "user.name",
      "user.email",
      "user.role",
      "products",
      "settings.theme",
      "date.today",
    ]);

    const validateTemplate = () => {
      const newErrors: Array<{ error: string; line: number }> = [];
      const lines = value.split("\n");
      
      // Simple validation: check for unclosed tags
      let ifCount = 0;
      let forCount = 0;
      
      lines.forEach((line) => {
        if (line.includes("{% if") || line.includes("{%- if")) ifCount++;
        if (line.includes("{% endif") || line.includes("{%- endif")) ifCount--;
        if (line.includes("{% for") || line.includes("{%- for")) forCount++;
        if (line.includes("{% endfor") || line.includes("{%- endfor")) forCount--;
      });
      
      if (ifCount > 0) {
        newErrors.push({ error: `Missing ${ifCount} endif statement(s)`, line: lines.length });
      }
      if (forCount > 0) {
        newErrors.push({ error: `Missing ${forCount} endfor statement(s)`, line: lines.length });
      }
      
      setErrors(newErrors);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Liquid Template Editor</h3>
          <Button onClick={validateTemplate}>Validate</Button>
        </div>
        
        <div className="h-[400px]">
          <CodeEditor
            value={value}
            onChange={setValue}
            errorLines={errors}
          />
        </div>
        
        {errors.length > 0 && (
          <div className="p-4 border border-destructive rounded-md">
            <h4 className="font-medium text-destructive mb-2">Validation Errors:</h4>
            <ul className="space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>
                  Line {error.line}: {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

export const TemplateLibrary: Story = {
  render: () => {
    const [selectedTemplate, setSelectedTemplate] = React.useState("greeting");
    const templates = {
      greeting: "Hello, {{ user.name }}!\n\nWelcome to our platform.",
      conditional: "{% if user.is_premium %}\n  Premium content here\n{% else %}\n  Standard content\n{% endif %}",
      loop: "{% for item in items %}\n  - {{ item.name }}: {{ item.price }}\n{% endfor %}",
      complex: liquidTemplate,
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={selectedTemplate === "greeting" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate("greeting")}
          >
            Greeting
          </Button>
          <Button
            variant={selectedTemplate === "conditional" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate("conditional")}
          >
            Conditional
          </Button>
          <Button
            variant={selectedTemplate === "loop" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate("loop")}
          >
            Loop
          </Button>
          <Button
            variant={selectedTemplate === "complex" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate("complex")}
          >
            Complex
          </Button>
        </div>
        
        <div className="h-[300px]">
          <CodeEditor
            value={templates[selectedTemplate as keyof typeof templates]}
            onChange={(value) => console.log("Changed:", value)}
          />
        </div>
      </div>
    );
  },
};

export const WithWordWrap: Story = {
  args: {
    value: "This is a very long line that should wrap when word wrap is enabled. " +
           "{{ user.name }} has a really long email address: {{ user.email }} " +
           "and we want to make sure it wraps properly in the editor.",
    options: {
      wordWrap: "on",
      wrappingIndent: "same",
    },
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const MultipleEditors: Story = {
  render: () => {
    const [values, setValues] = React.useState({
      header: "<!-- Header Template -->\n<header>{{ site.title }}</header>",
      body: "<!-- Body Template -->\n<main>{{ content }}</main>",
      footer: "<!-- Footer Template -->\n<footer>{{ site.copyright }}</footer>",
    });

    const handleChange = (section: keyof typeof values) => (value: string) => {
      setValues(prev => ({ ...prev, [section]: value }));
    };

    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Header Template</h4>
          <div className="h-[150px]">
            <CodeEditor
              value={values.header}
              onChange={handleChange("header")}
            />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Body Template</h4>
          <div className="h-[150px]">
            <CodeEditor
              value={values.body}
              onChange={handleChange("body")}
            />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Footer Template</h4>
          <div className="h-[150px]">
            <CodeEditor
              value={values.footer}
              onChange={handleChange("footer")}
            />
          </div>
        </div>
      </div>
    );
  },
};

export const EmptyState: Story = {
  args: {
    value: "",
    onChange: (value) => console.log("Value changed:", value),
  },
  decorators: [
    (Story) => (
      <div className="h-[400px]">
        <Story />
      </div>
    ),
  ],
};