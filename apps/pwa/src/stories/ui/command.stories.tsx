import type { Meta, StoryObj } from "@storybook/react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/shared/ui";
import {
  Calendar,
  Smile,
  Calculator,
  User,
  CreditCard,
  Settings,
  Mail,
  MessageSquare,
  PlusCircle,
  Music,
  Plane,
  FileText,
} from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Command",
  component: Command,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Command className="rounded-lg border shadow-md w-[450px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar className="mr-2 min-h-4 min-w-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile className="mr-2 min-h-4 min-w-4" />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <Calculator className="mr-2 min-h-4 min-w-4" />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 min-h-4 min-w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 min-h-4 min-w-4" />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 min-h-4 min-w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithDialog: Story = {
  args: {},
  render: () => {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((open) => !open);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, []);

    return (
      <>
        <p className="text-sm text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </p>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Calendar className="mr-2 min-h-4 min-w-4" />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem>
                <Smile className="mr-2 min-h-4 min-w-4" />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem>
                <Calculator className="mr-2 min-h-4 min-w-4" />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User className="mr-2 min-h-4 min-w-4" />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard className="mr-2 min-h-4 min-w-4" />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 min-h-4 min-w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const ComplexExample: Story = {
  args: {},
  render: () => (
    <Command className="rounded-lg border shadow-md w-[450px]">
      <CommandInput placeholder="Search for apps and commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Applications">
          <CommandItem>
            <Mail className="mr-2 min-h-4 min-w-4" />
            <span>Mail</span>
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <MessageSquare className="mr-2 min-h-4 min-w-4" />
            <span>Messages</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Music className="mr-2 min-h-4 min-w-4" />
            <span>Music</span>
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>Documents</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem>
            <PlusCircle className="mr-2 min-h-4 min-w-4" />
            <span>Create New File</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Plane className="mr-2 min-h-4 min-w-4" />
            <span>Airplane Mode</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Team">
          <CommandItem>
            <User className="mr-2 min-h-4 min-w-4" />
            <span>John Doe</span>
          </CommandItem>
          <CommandItem>
            <User className="mr-2 min-h-4 min-w-4" />
            <span>Jane Smith</span>
          </CommandItem>
          <CommandItem>
            <User className="mr-2 min-h-4 min-w-4" />
            <span>Bob Johnson</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const SearchableList: Story = {
  args: {},
  render: () => {
    const frameworks = [
      { value: "next.js", label: "Next.js" },
      { value: "sveltekit", label: "SvelteKit" },
      { value: "nuxt.js", label: "Nuxt.js" },
      { value: "remix", label: "Remix" },
      { value: "astro", label: "Astro" },
      { value: "gatsby", label: "Gatsby" },
      { value: "vue", label: "Vue.js" },
      { value: "angular", label: "Angular" },
    ];

    return (
      <Command className="rounded-lg border shadow-md w-[350px]">
        <CommandInput placeholder="Search framework..." />
        <CommandList>
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup heading="Frameworks">
            {frameworks.map((framework) => (
              <CommandItem key={framework.value} value={framework.value}>
                <span>{framework.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
};

export const WithCategories: Story = {
  args: {},
  render: () => (
    <Command className="rounded-lg border shadow-md w-[450px]">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Recent">
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>Project Proposal.docx</span>
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>Meeting Notes.txt</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Favorites">
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>Budget 2024.xlsx</span>
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>Design System.fig</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="All Files">
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>README.md</span>
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>package.json</span>
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 min-h-4 min-w-4" />
            <span>tsconfig.json</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithStates: Story = {
  args: {},
  render: () => (
    <Command className="rounded-lg border shadow-md w-[450px]">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Items">
          <CommandItem>
            <span>Default Item</span>
          </CommandItem>
          <CommandItem disabled>
            <span className="opacity-50">Disabled Item</span>
          </CommandItem>
          <CommandItem>
            <span>Another Item</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const FilterExample: Story = {
  args: {},
  render: () => {
    const [value, setValue] = React.useState("");

    const items = [
      { category: "Fruit", items: ["Apple", "Banana", "Orange", "Grape"] },
      { category: "Vegetable", items: ["Carrot", "Broccoli", "Spinach", "Tomato"] },
      { category: "Protein", items: ["Chicken", "Beef", "Fish", "Tofu"] },
    ];

    return (
      <div className="space-y-4">
        <Command className="rounded-lg border shadow-md w-[450px]">
          <CommandInput 
            placeholder="Filter items..." 
            value={value}
            onValueChange={setValue}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            {items.map((group) => (
              <React.Fragment key={group.category}>
                <CommandGroup heading={group.category}>
                  {group.items.map((item) => (
                    <CommandItem key={item} value={item}>
                      <span>{item}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
        {value && (
          <p className="text-sm text-muted-foreground">
            Current filter: <span className="font-medium">{value}</span>
          </p>
        )}
      </div>
    );
  },
};

export const InteractiveExample: Story = {
  args: {},
  render: () => {
    const [selected, setSelected] = React.useState("");
    const [open, setOpen] = React.useState(false);

    const actions = [
      { value: "create-file", label: "Create New File", shortcut: "⌘N" },
      { value: "open-file", label: "Open File", shortcut: "⌘O" },
      { value: "save-file", label: "Save File", shortcut: "⌘S" },
      { value: "delete-file", label: "Delete File", shortcut: "⌘D" },
    ];

    return (
      <div className="space-y-4 w-[450px]">
        <button
          onClick={() => setOpen(true)}
          className="w-full justify-between flex items-center rounded-md border px-4 py-2 text-sm"
        >
          {selected || "Select an action..."}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup heading="Actions">
              {actions.map((action) => (
                <CommandItem
                  key={action.value}
                  value={action.value}
                  onSelect={(value) => {
                    setSelected(action.label);
                    setOpen(false);
                  }}
                >
                  <span>{action.label}</span>
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        {selected && (
          <p className="text-sm text-muted-foreground">
            Selected action: <span className="font-medium">{selected}</span>
          </p>
        )}
      </div>
    );
  },
};