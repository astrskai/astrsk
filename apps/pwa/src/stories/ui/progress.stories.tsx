import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/shared/ui/progress";
import React from "react";

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Progress {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: {
    value: 0,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Progress {...args} />
    </div>
  ),
};

export const Complete: Story = {
  args: {
    value: 100,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Progress {...args} />
    </div>
  ),
};

export const CustomSizes: Story = {
  args: {
    value: 60,
  },
  render: (args) => (
    <div className="space-y-4 w-[400px]">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Small (h-1)</p>
        <Progress {...args} className="h-1" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Default (h-2)</p>
        <Progress {...args} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Medium (h-3)</p>
        <Progress {...args} className="h-3" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Large (h-4)</p>
        <Progress {...args} className="h-4" />
      </div>
    </div>
  ),
};

export const CustomColors: Story = {
  args: {
    value: 60,
  },
  render: (args) => (
    <div className="space-y-4 w-[400px]">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Default</p>
        <Progress {...args} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Success</p>
        <Progress {...args} className="[&>div]:bg-green-500 bg-green-500/20" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Warning</p>
        <Progress {...args} className="[&>div]:bg-yellow-500 bg-yellow-500/20" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Danger</p>
        <Progress {...args} className="[&>div]:bg-red-500 bg-red-500/20" />
      </div>
    </div>
  ),
};

export const AnimatedProgress: Story = {
  args: {},
  render: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="w-[400px]">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {progress}% Complete
        </p>
      </div>
    );
  },
};

export const LoadingSimulation: Story = {
  args: {},
  render: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-[400px] space-y-2">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Loading...</span>
          <span>{progress}%</span>
        </div>
      </div>
    );
  },
};

export const MultipleProgress: Story = {
  args: {},
  render: () => {
    const tasks = [
      { name: "Download", progress: 100 },
      { name: "Installation", progress: 75 },
      { name: "Configuration", progress: 30 },
      { name: "Verification", progress: 0 },
    ];

    return (
      <div className="space-y-4 w-[400px]">
        {tasks.map((task) => (
          <div key={task.name}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{task.name}</span>
              <span className="text-sm text-muted-foreground">
                {task.progress}%
              </span>
            </div>
            <Progress value={task.progress} />
          </div>
        ))}
      </div>
    );
  },
};

export const WithLabels: Story = {
  args: {},
  render: () => {
    const [progress, setProgress] = React.useState(33);

    return (
      <div className="space-y-6 w-[400px]">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Upload Progress</label>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-1">
            Uploading 3 of 9 files...
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setProgress(Math.max(0, progress - 10))}
            className="px-3 py-1 text-sm border rounded"
          >
            -10%
          </button>
          <button
            onClick={() => setProgress(Math.min(100, progress + 10))}
            className="px-3 py-1 text-sm border rounded"
          >
            +10%
          </button>
          <button
            onClick={() => setProgress(0)}
            className="px-3 py-1 text-sm border rounded"
          >
            Reset
          </button>
        </div>
      </div>
    );
  },
};

export const StepProgress: Story = {
  args: {},
  render: () => {
    const [currentStep, setCurrentStep] = React.useState(2);
    const totalSteps = 5;
    const progress = (currentStep / totalSteps) * 100;

    return (
      <div className="w-[400px] space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Setup Progress</span>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
            disabled={currentStep === totalSteps}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  },
};

export const IndeterminateProgress: Story = {
  args: {},
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Indeterminate Progress (Custom Animation)
        </p>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
          <div className="h-full w-1/3 bg-primary animate-[slide_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
      <style>{`
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  ),
};

export const RealWorldExample: Story = {
  args: {},
  render: () => {
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isUploading, setIsUploading] = React.useState(false);

    const startUpload = () => {
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 300);
    };

    return (
      <div className="w-[400px] space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">File Upload</h3>
          
          {!isUploading && uploadProgress === 0 && (
            <button
              onClick={startUpload}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Upload File
            </button>
          )}

          {(isUploading || uploadProgress > 0) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={uploadProgress} />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {isUploading && "Uploading document.pdf..."}
                {!isUploading && uploadProgress === 100 && "Upload complete!"}
              </div>

              {uploadProgress === 100 && (
                <button
                  onClick={() => {
                    setUploadProgress(0);
                    setIsUploading(false);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Upload another file
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
};