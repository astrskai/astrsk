import type { Meta, StoryObj } from "@storybook/react";
import { Confirm, UnsavedChangesConfirm, DeleteConfirm } from "@/components-v2/confirm";
import React from "react";
import { Button } from "@/components-v2/ui/button";

/**
 * Confirm Dialog Component
 * 
 * Figma Design Reference:
 * https://www.figma.com/design/JizSVJjUusquODy573n7QH/astrsk.ai-Design-2.5-color-changed?node-id=27923-56504&m=dev
 */
const meta = {
  title: "Figma/Confirm",
  component: Confirm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Confirm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [result, setResult] = React.useState<string>("");

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Confirmation</Button>
        
        <Confirm
          open={isOpen}
          onOpenChange={setIsOpen}
          onConfirm={() => {
            setResult("Confirmed!");
            setIsOpen(false);
          }}
        />
        
        {result && (
          <p className="text-sm text-muted-foreground">Result: {result}</p>
        )}
      </div>
    );
  },
};

export const CustomContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Custom Confirmation</Button>
        
        <Confirm
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Export Data"
          description="Are you sure you want to export all user data? This action will create a downloadable file containing sensitive information."
          confirmLabel="Export"
          onConfirm={() => {
            alert("Data exported!");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

export const UnsavedChanges: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [action, setAction] = React.useState("");

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Show Unsaved Changes Dialog</Button>
        
        <UnsavedChangesConfirm
          open={isOpen}
          onOpenChange={setIsOpen}
          onCloseWithoutSaving={() => {
            setAction("Discarded changes and continued");
          }}
        />
        
        {action && (
          <p className="text-sm text-muted-foreground">Action: {action}</p>
        )}
      </div>
    );
  },
};

export const DeleteConfirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [deleted, setDeleted] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        
        <DeleteConfirm
          open={isOpen}
          onOpenChange={setIsOpen}
          onDelete={() => {
            setDeleted(true);
          }}
        />
        
        {deleted && (
          <p className="text-sm text-destructive">Item has been deleted!</p>
        )}
      </div>
    );
  },
};

export const CustomFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open with Custom Footer</Button>
        
        <Confirm
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Subscribe to Newsletter"
          description="Would you like to receive weekly updates about our products?"
          footer={
            <div className="flex justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => {
                  alert("Maybe later!");
                  setIsOpen(false);
                }}
              >
                Maybe Later
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    alert("Never ask again");
                    setIsOpen(false);
                  }}
                >
                  Never
                </Button>
                <Button
                  onClick={() => {
                    alert("Subscribed!");
                    setIsOpen(false);
                  }}
                >
                  Subscribe
                </Button>
              </div>
            </div>
          }
          onConfirm={() => {}} // Not used when custom footer is provided
        />
      </div>
    );
  },
};

export const MultipleDialogs: Story = {
  render: () => {
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [unsavedOpen, setUnsavedOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [results, setResults] = React.useState<string[]>([]);

    const addResult = (result: string) => {
      setResults(prev => [...prev, result]);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setConfirmOpen(true)}>
            Basic Confirm
          </Button>
          <Button onClick={() => setUnsavedOpen(true)}>
            Unsaved Changes
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteOpen(true)}
          >
            Delete Confirm
          </Button>
        </div>
        
        <Confirm
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={() => {
            addResult("Basic confirmation completed");
            setConfirmOpen(false);
          }}
        />
        
        <UnsavedChangesConfirm
          open={unsavedOpen}
          onOpenChange={setUnsavedOpen}
          onCloseWithoutSaving={() => {
            addResult("Discarded unsaved changes");
          }}
        />
        
        <DeleteConfirm
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDelete={() => {
            addResult("Item deleted");
          }}
        />
        
        {results.length > 0 && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Action History:</h4>
            <ul className="space-y-1 text-sm">
              {results.map((result, index) => (
                <li key={index}>• {result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

export const FormIntegration: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({ name: "", email: "" });
    const [hasChanges, setHasChanges] = React.useState(false);
    const [showUnsaved, setShowUnsaved] = React.useState(false);

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };

    const handleReset = () => {
      if (hasChanges) {
        setShowUnsaved(true);
      } else {
        setFormData({ name: "", email: "" });
      }
    };

    return (
      <div className="space-y-4 w-96">
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-medium">User Form</h3>
          
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
            <Button 
              onClick={() => setIsOpen(true)}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </div>
        </div>
        
        <Confirm
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Save Changes"
          description="Are you sure you want to save these changes?"
          onConfirm={() => {
            alert("Changes saved!");
            setHasChanges(false);
            setIsOpen(false);
          }}
        />
        
        <UnsavedChangesConfirm
          open={showUnsaved}
          onOpenChange={setShowUnsaved}
          onCloseWithoutSaving={() => {
            setFormData({ name: "", email: "" });
            setHasChanges(false);
          }}
        />
      </div>
    );
  },
};

export const SequentialConfirmations: Story = {
  render: () => {
    const [step, setStep] = React.useState(0);
    const [results, setResults] = React.useState<string[]>([]);

    const steps = [
      {
        title: "Step 1: Export Data",
        description: "Do you want to export the current data?",
        confirmLabel: "Export",
      },
      {
        title: "Step 2: Clear Cache",
        description: "Should we clear the local cache?",
        confirmLabel: "Clear",
      },
      {
        title: "Step 3: Restart Application",
        description: "The application needs to restart. Continue?",
        confirmLabel: "Restart",
      },
    ];

    const handleConfirm = () => {
      setResults(prev => [...prev, `Completed: ${steps[step - 1].title}`]);
      if (step < steps.length) {
        setStep(step + 1);
      }
    };

    return (
      <div className="space-y-4">
        <Button onClick={() => setStep(1)}>
          Start Process
        </Button>
        
        {step > 0 && step <= steps.length && (
          <Confirm
            open={true}
            onOpenChange={(open) => !open && setStep(0)}
            title={steps[step - 1].title}
            description={steps[step - 1].description}
            confirmLabel={steps[step - 1].confirmLabel}
            onConfirm={handleConfirm}
          />
        )}
        
        {results.length > 0 && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Process Steps:</h4>
            <ul className="space-y-1 text-sm">
              {results.map((result, index) => (
                <li key={index} className="text-green-600">✓ {result}</li>
              ))}
            </ul>
            {results.length === steps.length && (
              <p className="mt-2 font-medium text-green-600">
                All steps completed successfully!
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
};