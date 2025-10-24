import type { Meta, StoryObj } from "@storybook/react";
import { LoadingOverlay } from "@/components-v2/loading-overlay";
import { useAppStore } from "@/shared/stores/app-store";
import React from "react";
import { Button } from "@/shared/ui";

const meta = {
  title: "Components/LoadingOverlay",
  component: LoadingOverlay,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const setIsLoading = useAppStore((state) => state.setIsLoading);
    
    React.useEffect(() => {
      setIsLoading(true);
      return () => setIsLoading(false);
    }, [setIsLoading]);

    return (
      <div className="h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Page Content</h1>
        <p>The loading overlay is currently active and covering this content.</p>
        <LoadingOverlay />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const { isLoading, setIsLoading } = useAppStore();

    return (
      <div className="h-screen p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold">Loading Overlay Demo</h1>
          <p>Click the button below to toggle the loading overlay.</p>
          
          <Button onClick={() => setIsLoading(!isLoading)}>
            {isLoading ? "Hide" : "Show"} Loading Overlay
          </Button>
          
          <div className="p-4 border rounded-lg">
            <p>Current state: {isLoading ? "Loading..." : "Not loading"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Card 1</h3>
              <p className="text-sm">This content will be covered by the overlay when loading.</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Card 2</h3>
              <p className="text-sm">The overlay prevents interaction with underlying content.</p>
            </div>
          </div>
        </div>
        
        <LoadingOverlay />
      </div>
    );
  },
};

export const TimedLoading: Story = {
  render: () => {
    const setIsLoading = useAppStore((state) => state.setIsLoading);
    const [timeLeft, setTimeLeft] = React.useState(0);

    const startLoading = (seconds: number) => {
      setIsLoading(true);
      setTimeLeft(seconds);
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLoading(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    return (
      <div className="h-screen p-8">
        <div className="max-w-xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold">Timed Loading Demo</h1>
          <p>Click a button to show the loading overlay for a specific duration.</p>
          
          <div className="flex gap-2">
            <Button onClick={() => startLoading(2)}>Load for 2s</Button>
            <Button onClick={() => startLoading(5)}>Load for 5s</Button>
            <Button onClick={() => startLoading(10)}>Load for 10s</Button>
          </div>
          
          {timeLeft > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-center font-medium">
                Loading will complete in {timeLeft} seconds...
              </p>
            </div>
          )}
        </div>
        
        <LoadingOverlay />
      </div>
    );
  },
};

export const WithContent: Story = {
  render: () => {
    const setIsLoading = useAppStore((state) => state.setIsLoading);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const simulateProcess = async () => {
      setIsProcessing(true);
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setIsLoading(false);
      setIsProcessing(false);
      alert("Process completed!");
    };

    return (
      <div className="h-screen">
        <header className="border-b p-4">
          <h1 className="text-xl font-semibold">Application Header</h1>
        </header>
        
        <main className="p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Data Processing</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Item {item}</h3>
                  <p className="text-sm text-muted-foreground">
                    Sample data that will be processed.
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={simulateProcess} 
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? "Processing..." : "Start Processing"}
              </Button>
            </div>
          </div>
        </main>
        
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © 2024 Application
        </footer>
        
        <LoadingOverlay />
      </div>
    );
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => {
    const setIsLoading = useAppStore((state) => state.setIsLoading);
    
    React.useEffect(() => {
      setIsLoading(true);
      return () => setIsLoading(false);
    }, [setIsLoading]);

    return (
      <div className="h-screen p-4">
        <h1 className="text-xl font-bold mb-4">Mobile View</h1>
        <p className="text-sm">The loading overlay adapts to mobile screens with a smaller logo.</p>
        <LoadingOverlay />
      </div>
    );
  },
};

export const SequentialLoading: Story = {
  render: () => {
    const setIsLoading = useAppStore((state) => state.setIsLoading);
    const [step, setStep] = React.useState(0);
    const [results, setResults] = React.useState<string[]>([]);

    const steps = [
      "Fetching user data...",
      "Loading preferences...",
      "Syncing with server...",
      "Preparing dashboard...",
      "Complete!",
    ];

    const runSequence = async () => {
      setResults([]);
      setStep(0);
      
      for (let i = 0; i < steps.length; i++) {
        setStep(i);
        setIsLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setResults(prev => [...prev, steps[i]]);
        
        if (i === steps.length - 1) {
          setIsLoading(false);
        }
      }
    };

    return (
      <div className="h-screen p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Sequential Loading Demo</h1>
          
          <Button onClick={runSequence}>Start Sequential Process</Button>
          
          {step > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Current Step: {steps[step]}</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Completed Steps:</h3>
              <ul className="space-y-1">
                {results.map((result, index) => (
                  <li key={index} className="text-sm text-green-600">
                    ✓ {result}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <LoadingOverlay />
      </div>
    );
  },
};