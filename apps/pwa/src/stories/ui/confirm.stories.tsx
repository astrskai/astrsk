import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Confirm, DeleteConfirm, UnsavedChangesConfirm } from "@/components-v2/confirm";

const meta = {
  title: "UI/Confirm Dialogs",
  component: Confirm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Confirm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicConfirm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Confirm Dialog</Button>
        <Confirm
          open={open}
          onOpenChange={setOpen}
          title="Confirm Action"
          description="Are you sure you want to proceed with this action?"
          confirmLabel="Proceed"
          onConfirm={() => {
            console.log("Confirmed!");
          }}
        />
      </>
    );
  },
};

export const DeleteConfirmSimple: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Item
        </Button>
        <DeleteConfirm
          open={open}
          onOpenChange={setOpen}
          description="This action cannot be undone. This will permanently delete the item."
          onDelete={() => {
            console.log("Deleted!");
          }}
        />
      </>
    );
  },
};

export const DeleteConfirmWithWarning: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const sessionCount = 5;
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Card
        </Button>
        <DeleteConfirm
          open={open}
          onOpenChange={setOpen}
          description={
            <>
              This card is used in{" "}
              <span className="text-secondary-normal">
                {sessionCount} sessions
              </span>
              .
              <br />
              Deleting it might corrupt or disable these sessions.
            </>
          }
          onDelete={() => {
            console.log("Card deleted!");
          }}
        />
      </>
    );
  },
};

export const DeleteFlowWithSessions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const sessionCount = 12;
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Flow
        </Button>
        <DeleteConfirm
          open={open}
          onOpenChange={setOpen}
          description={
            <>
              This flow is used in{" "}
              <span className="text-secondary-normal">
                {sessionCount} sessions
              </span>
              .
              <br />
              Deleting it might corrupt or disable these sessions.
            </>
          }
          onDelete={() => {
            console.log("Flow deleted!");
          }}
        />
      </>
    );
  },
};

export const DeleteSession: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Session
        </Button>
        <DeleteConfirm
          open={open}
          onOpenChange={setOpen}
          description="This action cannot be undone. This will permanently delete the session and all its messages."
          onDelete={() => {
            console.log("Session deleted!");
          }}
        />
      </>
    );
  },
};

export const CustomDeleteLabel: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Remove Account
        </Button>
        <DeleteConfirm
          open={open}
          onOpenChange={setOpen}
          title="Remove Account?"
          description="This will permanently remove your account and all associated data. This action is irreversible."
          deleteLabel="Remove Account"
          onDelete={() => {
            console.log("Account removed!");
          }}
        />
      </>
    );
  },
};

export const UnsavedChanges: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          Close Editor (with unsaved changes)
        </Button>
        <UnsavedChangesConfirm
          open={open}
          onOpenChange={setOpen}
          onCloseWithoutSaving={() => {
            console.log("Closed without saving!");
          }}
        />
      </>
    );
  },
};

export const DeleteWithNoSessions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const sessionCount = 0;
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Unused Card
        </Button>
        <DeleteConfirm
          open={open}
          onOpenChange={setOpen}
          description={
            <>
              This card is used in{" "}
              <span className="text-secondary-normal">
                {sessionCount} sessions
              </span>
              .
              <br />
              Deleting it might corrupt or disable these sessions.
            </>
          }
          onDelete={() => {
            console.log("Unused card deleted!");
          }}
        />
      </>
    );
  },
};

export const TriggerExample: Story = {
  render: () => (
    <DeleteConfirm
      title="Delete File?"
      description="This will permanently delete the selected file from your system."
      onDelete={() => {
        console.log("File deleted!");
      }}
    >
      <Button variant="destructive">Delete File (with trigger)</Button>
    </DeleteConfirm>
  ),
};