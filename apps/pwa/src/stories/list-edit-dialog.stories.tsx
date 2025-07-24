import type { Meta, StoryObj } from "@storybook/react";
import { ListEditDialog, type ListEditAction } from "@/components-v2/list-edit-dialog";
import React from "react";

const meta = {
  title: "Components/ListEditDialog",
  component: ListEditDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ListEditDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onAction: (action) => alert(`Action clicked: ${action}`),
  },
};

export const AllActions: Story = {
  args: {
    actions: ["copy", "export", "import", "delete"],
    onAction: (action) => alert(`Action clicked: ${action}`),
  },
};

export const LimitedActions: Story = {
  args: {
    actions: ["copy", "delete"],
    onAction: (action) => alert(`Action clicked: ${action}`),
  },
};

export const WithDisabledActions: Story = {
  args: {
    actions: ["copy", "export", "import", "delete"],
    disabled: {
      import: true,
      export: true,
    },
    onAction: (action) => alert(`Action clicked: ${action}`),
  },
};

export const OnlyDelete: Story = {
  args: {
    actions: ["delete"],
    onAction: (action) => alert(`Action clicked: ${action}`),
  },
};

export const CustomStyling: Story = {
  args: {
    triggerClassName: "h-12 w-12",
    contentClassName: "w-72",
    onAction: (action) => alert(`Action clicked: ${action}`),
  },
};

export const InteractiveExample: Story = {
  args: {
    onAction: () => {},
  },
  render: () => {
    const [lastAction, setLastAction] = React.useState<ListEditAction | null>(null);
    const [actionCount, setActionCount] = React.useState({
      copy: 0,
      export: 0,
      import: 0,
      delete: 0,
    });

    const handleAction = (action: ListEditAction) => {
      setLastAction(action);
      setActionCount(prev => ({
        ...prev,
        [action]: prev[action] + 1,
      }));
    };

    return (
      <div className="space-y-4">
        <ListEditDialog onAction={handleAction} />
        
        {lastAction && (
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium">Last action: {lastAction}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>Copy: {actionCount.copy} times</p>
              <p>Export: {actionCount.export} times</p>
              <p>Import: {actionCount.import} times</p>
              <p>Delete: {actionCount.delete} times</p>
            </div>
          </div>
        )}
      </div>
    );
  },
};

export const InContext: Story = {
  args: {
    onAction: () => {},
  },
  render: () => {
    const items = [
      { id: 1, name: "Item 1", description: "First item description" },
      { id: 2, name: "Item 2", description: "Second item description" },
      { id: 3, name: "Item 3", description: "Third item description" },
    ];

    return (
      <div className="w-[400px] space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ListEditDialog
              onAction={(action) => alert(`${action} ${item.name}`)}
            />
          </div>
        ))}
      </div>
    );
  },
};

export const ConditionalActions: Story = {
  args: {
    onAction: () => {},
  },
  render: () => {
    const [canExport, setCanExport] = React.useState(true);
    const [canDelete, setCanDelete] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={canExport}
              onChange={(e) => setCanExport(e.target.checked)}
            />
            <span>Can Export</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={canDelete}
              onChange={(e) => setCanDelete(e.target.checked)}
            />
            <span>Can Delete</span>
          </label>
        </div>

        <ListEditDialog
          disabled={{
            export: !canExport,
            delete: !canDelete,
          }}
          onAction={(action) => alert(`Action: ${action}`)}
        />
      </div>
    );
  },
};

export const MultipleDialogs: Story = {
  args: {
    onAction: () => {},
  },
  render: () => {
    return (
      <div className="flex gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">All Actions</h3>
          <ListEditDialog
            onAction={(action) => alert(`Dialog 1: ${action}`)}
          />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Read Only</h3>
          <ListEditDialog
            actions={["copy", "export"]}
            onAction={(action) => alert(`Dialog 2: ${action}`)}
          />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Modify Only</h3>
          <ListEditDialog
            actions={["import", "delete"]}
            onAction={(action) => alert(`Dialog 3: ${action}`)}
          />
        </div>
      </div>
    );
  },
};

export const TableExample: Story = {
  args: {
    onAction: () => {},
  },
  render: () => {
    const data = [
      { id: 1, name: "Project Alpha", status: "Active", created: "2024-01-15" },
      { id: 2, name: "Project Beta", status: "Completed", created: "2024-02-20" },
      { id: 3, name: "Project Gamma", status: "Pending", created: "2024-03-10" },
    ];

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Created</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.status}</td>
              <td className="p-2">{item.created}</td>
              <td className="p-2 text-right">
                <ListEditDialog
                  onAction={(action) => alert(`${action} ${item.name}`)}
                  disabled={{
                    delete: item.status === "Active",
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
};