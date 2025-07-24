import type { Meta, StoryObj } from "@storybook/react";
import { ColorPicker } from "@/components-v2/color-picker";
import React from "react";

const meta = {
  title: "Components/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "#FF5733",
    onChange: (value) => console.log("Color changed:", value),
  },
};

export const Vertical: Story = {
  args: {
    value: "#3498DB",
    orientation: "vertical",
    onChange: (value) => console.log("Color changed:", value),
  },
};

export const Horizontal: Story = {
  args: {
    value: "#2ECC71",
    orientation: "horizontal",
    onChange: (value) => console.log("Color changed:", value),
  },
};

export const Controlled: Story = {
  args: {
    value: "#9B59B6",
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [color, setColor] = React.useState<string | null>("#9B59B6");

    return (
      <div className="space-y-4">
        <ColorPicker value={color} onChange={setColor} />
        <div className="space-y-2">
          <p className="text-sm">Selected color: {color || "None"}</p>
          <div 
            className="w-full h-20 rounded border"
            style={{ backgroundColor: color || "transparent" }}
          />
        </div>
      </div>
    );
  },
};

export const BothOrientations: Story = {
  args: {
    value: "#E74C3C",
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [color, setColor] = React.useState<string | null>("#E74C3C");

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Vertical Orientation</h3>
          <ColorPicker 
            value={color} 
            onChange={setColor}
            orientation="vertical"
          />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Horizontal Orientation</h3>
          <ColorPicker 
            value={color} 
            onChange={setColor}
            orientation="horizontal"
          />
        </div>
      </div>
    );
  },
};

export const NoInitialValue: Story = {
  args: {
    value: null,
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [color, setColor] = React.useState<string | null>(null);

    return (
      <div className="space-y-4">
        <ColorPicker value={color} onChange={setColor} />
        <p className="text-sm text-muted-foreground">
          {color ? `Selected: ${color}` : "No color selected"}
        </p>
      </div>
    );
  },
};

export const DisabledState: Story = {
  args: {
    value: "#95A5A6",
    disabled: true,
    onChange: () => {},
  },
};

export const MultipleColorPickers: Story = {
  args: {
    value: "#3498DB",
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [primaryColor, setPrimaryColor] = React.useState("#3498DB");
    const [secondaryColor, setSecondaryColor] = React.useState("#E74C3C");
    const [accentColor, setAccentColor] = React.useState("#F39C12");

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Color</label>
            <ColorPicker 
              value={primaryColor} 
              onChange={(value) => setPrimaryColor(value || "#3498DB")}
              orientation="vertical"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Secondary Color</label>
            <ColorPicker 
              value={secondaryColor} 
              onChange={(value) => setSecondaryColor(value || "#E74C3C")}
              orientation="vertical"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Accent Color</label>
            <ColorPicker 
              value={accentColor} 
              onChange={(value) => setAccentColor(value || "#F39C12")}
              orientation="vertical"
            />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border space-y-2">
          <h3 style={{ color: primaryColor }}>Primary Text</h3>
          <p style={{ color: secondaryColor }}>Secondary text content</p>
          <button 
            className="px-4 py-2 rounded text-white"
            style={{ backgroundColor: accentColor }}
          >
            Accent Button
          </button>
        </div>
      </div>
    );
  },
};

export const ColorPalette: Story = {
  args: {
    value: "#FF6B6B",
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [colors, setColors] = React.useState([
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
    ]);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {colors.map((color, index) => (
            <button
              key={index}
              className={`w-12 h-12 rounded border-2 ${
                selectedIndex === index ? "border-primary" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </div>
        
        <ColorPicker
          value={colors[selectedIndex]}
          onChange={(newColor) => {
            const newColors = [...colors];
            newColors[selectedIndex] = newColor || "#000000";
            setColors(newColors);
          }}
          orientation="horizontal"
        />
      </div>
    );
  },
};

export const FormExample: Story = {
  args: {
    value: "#3498DB",
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [formData, setFormData] = React.useState({
      name: "My Theme",
      primaryColor: "#3498DB",
      backgroundColor: "#FFFFFF",
      textColor: "#2C3E50",
    });

    return (
      <form className="space-y-4 w-[300px]">
        <div className="space-y-2">
          <label className="text-sm font-medium">Theme Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Color</label>
          <ColorPicker
            value={formData.primaryColor}
            onChange={(color) => setFormData({ ...formData, primaryColor: color || "" })}
            orientation="horizontal"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Background Color</label>
          <ColorPicker
            value={formData.backgroundColor}
            onChange={(color) => setFormData({ ...formData, backgroundColor: color || "" })}
            orientation="horizontal"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Color</label>
          <ColorPicker
            value={formData.textColor}
            onChange={(color) => setFormData({ ...formData, textColor: color || "" })}
            orientation="horizontal"
          />
        </div>
        
        <div 
          className="p-4 rounded-lg mt-4"
          style={{ 
            backgroundColor: formData.backgroundColor,
            color: formData.textColor,
            borderColor: formData.primaryColor,
            borderWidth: "2px",
            borderStyle: "solid"
          }}
        >
          <h3 style={{ color: formData.primaryColor }}>Preview</h3>
          <p>This is how your theme will look</p>
        </div>
      </form>
    );
  },
};

export const WithReset: Story = {
  args: {
    value: "#FF5733",
    onChange: (value) => console.log("Color changed:", value),
  },
  render: () => {
    const [color, setColor] = React.useState<string | null>("#FF5733");
    const defaultColor = "#3498DB";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <ColorPicker value={color} onChange={setColor} />
          <button
            onClick={() => setColor(defaultColor)}
            className="px-3 py-1 text-sm border rounded hover:bg-muted"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setColor(null)}
            className="px-3 py-1 text-sm border rounded hover:bg-muted"
          >
            Clear
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Current: {color || "None"} | Default: {defaultColor}
        </p>
      </div>
    );
  },
};