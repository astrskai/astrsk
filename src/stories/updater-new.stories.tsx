import type { Meta, StoryObj } from "@storybook/react";
import { UpdaterNew } from "@/components-v2/updater-new";
import React from "react";
import { Button } from "@/components-v2/ui/button";

const meta = {
  title: "Components/UpdaterNew",
  component: UpdaterNew,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UpdaterNew>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContext: Story = {
  render: () => (
    <div className="p-8 bg-background-surface-2 rounded-lg">
      <h3 className="font-semibold mb-4">Application Header</h3>
      <div className="flex items-center justify-between">
        <span>App Name</span>
        <div className="flex items-center gap-2">
          <UpdaterNew />
          <Button size="icon" variant="ghost">
            <span className="text-xl">⚙️</span>
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const SimulatedStates: Story = {
  render: () => {
    const [updateAvailable, setUpdateAvailable] = React.useState(false);
    const [updateType, setUpdateType] = React.useState<"electron" | "pwa">("electron");
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [downloadProgress, setDownloadProgress] = React.useState(0);

    const simulateDownload = () => {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDownloading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    };

    const handleUpdate = () => {
      if (updateType === "electron") {
        simulateDownload();
      } else {
        alert("PWA update ready! The app will restart.");
        setUpdateAvailable(false);
      }
    };

    return (
      <div className="space-y-6 w-96">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-4">Update Simulator</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Update Type</label>
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value as "electron" | "pwa")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="electron">Electron Update</option>
                <option value="pwa">PWA Update</option>
              </select>
            </div>
            
            <Button
              onClick={() => setUpdateAvailable(!updateAvailable)}
              className="w-full"
            >
              {updateAvailable ? "Hide" : "Show"} Update Available
            </Button>
          </div>
        </div>

        {updateAvailable && (
          <div className="p-4 border-2 border-primary rounded-lg">
            <h4 className="font-medium mb-2">
              {updateType === "electron" ? "Desktop" : "Web"} App Update Available
            </h4>
            
            {isDownloading ? (
              <div className="space-y-2">
                <p className="text-sm">Downloading update...</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {downloadProgress}% complete
                </p>
              </div>
            ) : downloadProgress === 100 ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600">✓ Update downloaded!</p>
                <Button onClick={() => alert("Restarting app...")} size="sm">
                  Restart to Update
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  A new version is available with bug fixes and improvements.
                </p>
                <Button onClick={handleUpdate} size="sm">
                  {updateType === "electron" ? "Download Update" : "Update Now"}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Actual UpdaterNew component:
          </p>
          <div className="inline-flex">
            <UpdaterNew />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            (Shows when real updates are available)
          </p>
        </div>
      </div>
    );
  },
};

export const UpdateFlow: Story = {
  render: () => {
    const [step, setStep] = React.useState(0);
    
    const steps = [
      {
        title: "Checking for Updates",
        description: "Looking for new versions...",
        action: null,
      },
      {
        title: "Update Available",
        description: "Version 2.1.0 is ready to download",
        action: "Download",
      },
      {
        title: "Downloading",
        description: "Please wait while we download the update",
        action: null,
      },
      {
        title: "Ready to Install",
        description: "Update downloaded successfully",
        action: "Restart & Install",
      },
      {
        title: "Installing",
        description: "The application will restart momentarily",
        action: null,
      },
    ];

    const handleAction = () => {
      if (step === 1) setStep(2); // Start download
      else if (step === 3) setStep(4); // Start install
    };

    React.useEffect(() => {
      if (step === 0) {
        const timer = setTimeout(() => setStep(1), 2000);
        return () => clearTimeout(timer);
      } else if (step === 2) {
        const timer = setTimeout(() => setStep(3), 3000);
        return () => clearTimeout(timer);
      } else if (step === 4) {
        const timer = setTimeout(() => {
          alert("Application restarted with new version!");
          setStep(0);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [step]);

    return (
      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{steps[step].title}</h3>
          <p className="text-muted-foreground mb-4">{steps[step].description}</p>
          
          {step === 2 && (
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          )}
          
          {steps[step].action && (
            <Button onClick={handleAction}>
              {steps[step].action}
            </Button>
          )}
          
          {(step === 0 || step === 2 || step === 4) && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
        </div>
        
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-center">
            Demo Step: {step + 1} of {steps.length}
          </p>
        </div>
      </div>
    );
  },
};

export const ComparisonView: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Electron Updates</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Auto-download available</li>
            <li>• Shows progress bar</li>
            <li>• Requires app restart</li>
            <li>• Handled by electron-updater</li>
          </ul>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">PWA Updates</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Service worker based</li>
            <li>• Instant update</li>
            <li>• Page reload required</li>
            <li>• Periodic sync check</li>
          </ul>
        </div>
      </div>
      
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-sm mb-2">Both update types use the same UI component:</p>
        <UpdaterNew />
      </div>
    </div>
  ),
};

export const TooltipDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Hover over the update icon to see the tooltip
        </p>
        <div className="inline-flex p-8 border-2 border-dashed rounded-lg">
          <UpdaterNew />
        </div>
      </div>
      
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-center">
          When an update is available, the icon shows with a red dot
          and displays "Restart to update!" on hover
        </p>
      </div>
    </div>
  ),
};