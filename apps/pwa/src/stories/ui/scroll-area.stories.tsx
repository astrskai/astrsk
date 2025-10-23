import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/components-v2/ui/separator";
import { Button } from "@/shared/ui/button";
import React from "react";

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div className="space-y-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i}>
            <div className="text-sm">
              Item {i + 1} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </div>
            {i < 9 && <Separator className="my-2" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const WithTags: Story = {
  render: () => {
    const tags = Array.from({ length: 50 }).map(
      (_, i, a) => `v1.2.0-beta.${a.length - i}`
    );

    return (
      <ScrollArea className="h-72 w-48 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
          {tags.map((tag) => (
            <React.Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              <Separator className="my-2" />
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <figure key={i} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <div className="h-32 w-32 bg-muted flex items-center justify-center">
                <span className="text-2xl font-semibold">{i + 1}</span>
              </div>
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Photo {i + 1}
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-[400px] w-[500px] rounded-md border p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Terms of Service</h3>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="space-y-2">
            <h4 className="font-medium">Section {i + 1}</h4>
            <p className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim 
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex 
              ea commodo consequat.
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const MessageList: Story = {
  render: () => {
    const messages = [
      { id: 1, sender: "Alice", message: "Hey, how are you?", time: "10:00 AM" },
      { id: 2, sender: "You", message: "I'm good, thanks! How about you?", time: "10:02 AM" },
      { id: 3, sender: "Alice", message: "Doing great! Want to grab lunch?", time: "10:05 AM" },
      { id: 4, sender: "You", message: "Sure! Where do you want to go?", time: "10:07 AM" },
      { id: 5, sender: "Alice", message: "How about that new Italian place?", time: "10:10 AM" },
      { id: 6, sender: "You", message: "Sounds perfect! What time?", time: "10:12 AM" },
      { id: 7, sender: "Alice", message: "12:30 PM works for me", time: "10:15 AM" },
      { id: 8, sender: "You", message: "Great! See you there", time: "10:17 AM" },
      { id: 9, sender: "Alice", message: "Looking forward to it! 😊", time: "10:20 AM" },
      { id: 10, sender: "You", message: "Me too! See you soon", time: "10:22 AM" },
    ];

    return (
      <ScrollArea className="h-[300px] w-[400px] rounded-md border">
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender === "You" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}
              >
                <p className="text-sm font-medium">{msg.sender}</p>
                <p className="text-sm mt-1">{msg.message}</p>
                <p className="text-xs mt-2 opacity-70">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const CodeBlock: Story = {
  render: () => (
    <ScrollArea className="h-[300px] w-[600px] rounded-md border bg-muted">
      <pre className="p-4">
        <code className="text-sm">{`import React from 'react';
import { useState, useEffect } from 'react';

function ExampleComponent() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };

  const handleDecrement = () => {
    setCount(prevCount => prevCount - 1);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>Example Component</h1>
      <div className="counter">
        <button onClick={handleDecrement}>-</button>
        <span>{count}</span>
        <button onClick={handleIncrement}>+</button>
      </div>
      {data && (
        <div className="data">
          <h2>Data:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ExampleComponent;`}</code>
      </pre>
    </ScrollArea>
  ),
};

export const FileList: Story = {
  render: () => {
    const files = [
      { name: "README.md", size: "2.4 KB", modified: "2 hours ago" },
      { name: "package.json", size: "1.2 KB", modified: "3 hours ago" },
      { name: "tsconfig.json", size: "856 B", modified: "1 day ago" },
      { name: ".gitignore", size: "234 B", modified: "1 day ago" },
      { name: "src/index.ts", size: "5.6 KB", modified: "30 minutes ago" },
      { name: "src/App.tsx", size: "8.9 KB", modified: "1 hour ago" },
      { name: "src/components/Button.tsx", size: "3.2 KB", modified: "2 hours ago" },
      { name: "src/components/Card.tsx", size: "4.1 KB", modified: "3 hours ago" },
      { name: "src/styles/globals.css", size: "1.8 KB", modified: "1 day ago" },
      { name: "public/index.html", size: "1.1 KB", modified: "2 days ago" },
      { name: "public/favicon.ico", size: "4.2 KB", modified: "1 week ago" },
      { name: "tests/App.test.tsx", size: "2.7 KB", modified: "4 hours ago" },
    ];

    return (
      <ScrollArea className="h-[300px] w-[500px] rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium">Project Files</h4>
          <div className="space-y-1">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-2 px-2 hover:bg-muted rounded-sm cursor-pointer"
              >
                <span className="text-sm font-medium">{file.name}</span>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>{file.modified}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    )
  },
};

export const NestedScrollAreas: Story = {
  render: () => (
    <ScrollArea className="h-[400px] w-[600px] rounded-md border p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Main Content Area</h3>
        <p className="text-sm text-muted-foreground">
          This is the main scroll area that contains nested scroll areas.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="mb-2 font-medium">Left Panel</h4>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-2">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="text-sm">
                    Left item {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div>
            <h4 className="mb-2 font-medium">Right Panel</h4>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-2">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="text-sm">
                    Right item {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          More content in the main area...
        </p>
        
        {Array.from({ length: 10 }, (_, i) => (
          <p key={i} className="text-sm">
            Additional paragraph {i + 1} in the main scroll area.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [items, setItems] = React.useState(
      Array.from({ length: 5 }, (_, i) => `Item ${i + 1}`)
    );

    const addItem = () => {
      setItems([...items, `Item ${items.length + 1}`]);
    };

    const removeItem = () => {
      if (items.length > 0) {
        setItems(items.slice(0, -1));
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={addItem}
            size="sm"
          >
            Add Item
          </Button>
          <Button 
            onClick={removeItem}
            variant="destructive"
            size="sm"
            disabled={items.length === 0}
          >
            Remove Item
          </Button>
        </div>
        
        <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items to display</p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="p-2 bg-muted rounded-sm">
                  <p className="text-sm">{item}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <p className="text-sm text-muted-foreground">
          Total items: {items.length}
        </p>
      </div>
    );
  },
};