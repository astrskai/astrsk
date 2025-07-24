import type { Meta, StoryObj } from "@storybook/react";
import { SortDialog } from "@/components-v2/sort-dialog";
import React from "react";

const meta = {
  title: "Components/SortDialog",
  component: SortDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SortDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultOptions = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Date (Newest)", value: "date-desc" },
  { label: "Date (Oldest)", value: "date-asc" },
  { label: "Size (Largest)", value: "size-desc" },
  { label: "Size (Smallest)", value: "size-asc" },
];

export const Default: Story = {
  args: {
    options: defaultOptions,
    onSort: (value) => alert(`Sorted by: ${value}`),
  },
};

export const SimpleOptions: Story = {
  args: {
    options: [
      { label: "Alphabetical", value: "alpha" },
      { label: "Recent", value: "recent" },
      { label: "Popular", value: "popular" },
    ],
    onSort: (value) => alert(`Sorted by: ${value}`),
  },
};

export const CustomStyles: Story = {
  args: {
    options: defaultOptions,
    triggerClassName: "text-blue-500 hover:text-blue-600",
    contentClassName: "w-64",
    onSort: (value) => alert(`Sorted by: ${value}`),
  },
};

export const InteractiveExample: Story = {
  args: {
    options: defaultOptions,
    onSort: () => {},
  },
  render: () => {
    const [sortBy, setSortBy] = React.useState("name-asc");
    const [items, setItems] = React.useState([
      { id: 1, name: "Document A", date: "2024-03-15", size: 1024 },
      { id: 2, name: "Report B", date: "2024-03-10", size: 2048 },
      { id: 3, name: "Presentation C", date: "2024-03-20", size: 512 },
      { id: 4, name: "Spreadsheet D", date: "2024-03-05", size: 3072 },
    ]);

    const handleSort = (value: string) => {
      setSortBy(value);
      
      const sorted = [...items].sort((a, b) => {
        switch (value) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "date-asc":
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case "date-desc":
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case "size-asc":
            return a.size - b.size;
          case "size-desc":
            return b.size - a.size;
          default:
            return 0;
        }
      });
      
      setItems(sorted);
    };

    return (
      <div className="w-96 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Files</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by: {sortBy}</span>
            <SortDialog options={defaultOptions} onSort={handleSort} />
          </div>
        </div>
        
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <p className="text-sm">{(item.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const TableIntegration: Story = {
  args: {
    options: [],
    onSort: () => {},
  },
  render: () => {
    const [sortBy, setSortBy] = React.useState("name-asc");
    
    const users = [
      { id: 1, name: "Alice Johnson", role: "Admin", joined: "2023-01-15" },
      { id: 2, name: "Bob Smith", role: "User", joined: "2023-06-20" },
      { id: 3, name: "Charlie Brown", role: "Editor", joined: "2023-03-10" },
      { id: 4, name: "Diana Prince", role: "Admin", joined: "2023-02-28" },
    ];

    const sortOptions = [
      { label: "Name (A-Z)", value: "name-asc" },
      { label: "Name (Z-A)", value: "name-desc" },
      { label: "Role", value: "role" },
      { label: "Join Date (Newest)", value: "joined-desc" },
      { label: "Join Date (Oldest)", value: "joined-asc" },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">User Management</h3>
          <SortDialog options={sortOptions} onSort={setSortBy} />
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-2">{user.name}</td>
                <td className="p-2">
                  <span className="px-2 py-1 text-xs bg-muted rounded">
                    {user.role}
                  </span>
                </td>
                <td className="p-2 text-muted-foreground">{user.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <p className="text-sm text-muted-foreground">
          Currently sorted by: {sortBy}
        </p>
      </div>
    );
  },
};

export const ProductGrid: Story = {
  args: {
    options: [],
    onSort: () => {},
  },
  render: () => {
    const [sortBy, setSortBy] = React.useState("featured");
    
    const sortOptions = [
      { label: "Featured", value: "featured" },
      { label: "Price: Low to High", value: "price-asc" },
      { label: "Price: High to Low", value: "price-desc" },
      { label: "Customer Rating", value: "rating" },
      { label: "Best Sellers", value: "sales" },
      { label: "New Arrivals", value: "new" },
    ];
    
    const products = [
      { id: 1, name: "Product A", price: 29.99, rating: 4.5 },
      { id: 2, name: "Product B", price: 49.99, rating: 4.8 },
      { id: 3, name: "Product C", price: 19.99, rating: 4.2 },
      { id: 4, name: "Product D", price: 39.99, rating: 4.7 },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Products</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {products.length} items
            </span>
            <SortDialog 
              options={sortOptions} 
              onSort={setSortBy}
              triggerClassName="text-primary"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-lg font-bold mt-2">${product.price}</p>
              <p className="text-sm text-muted-foreground">
                ★ {product.rating}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const GroupedOptions: Story = {
  args: {
    options: [],
    onSort: () => {},
  },
  render: () => {
    const [selected, setSelected] = React.useState("");
    
    const options = [
      { label: "Most Relevant", value: "relevant" },
      { label: "--- By Name ---", value: "divider1" },
      { label: "A to Z", value: "name-asc" },
      { label: "Z to A", value: "name-desc" },
      { label: "--- By Date ---", value: "divider2" },
      { label: "Newest First", value: "date-new" },
      { label: "Oldest First", value: "date-old" },
      { label: "--- By Activity ---", value: "divider3" },
      { label: "Most Active", value: "active" },
      { label: "Least Active", value: "inactive" },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">Sort by:</span>
          <SortDialog 
            options={options} 
            onSort={(value) => {
              if (!value.includes("divider")) {
                setSelected(value);
              }
            }}
          />
        </div>
        
        {selected && (
          <p className="text-sm text-muted-foreground">
            Selected: {options.find(opt => opt.value === selected)?.label}
          </p>
        )}
      </div>
    );
  },
};

export const DynamicOptions: Story = {
  args: {
    options: [],
    onSort: () => {},
  },
  render: () => {
    const [category, setCategory] = React.useState("documents");
    const [sortValue, setSortValue] = React.useState("");
    
    const sortOptionsByCategory = {
      documents: [
        { label: "Name", value: "name" },
        { label: "Modified Date", value: "modified" },
        { label: "Size", value: "size" },
        { label: "Type", value: "type" },
      ],
      images: [
        { label: "Name", value: "name" },
        { label: "Date Taken", value: "date" },
        { label: "Size", value: "size" },
        { label: "Dimensions", value: "dimensions" },
        { label: "Color", value: "color" },
      ],
      contacts: [
        { label: "First Name", value: "first" },
        { label: "Last Name", value: "last" },
        { label: "Company", value: "company" },
        { label: "Recently Added", value: "recent" },
      ],
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${category === "documents" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setCategory("documents")}
          >
            Documents
          </button>
          <button
            className={`px-3 py-1 rounded ${category === "images" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setCategory("images")}
          >
            Images
          </button>
          <button
            className={`px-3 py-1 rounded ${category === "contacts" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setCategory("contacts")}
          >
            Contacts
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <span className="font-medium capitalize">{category}</span>
          <SortDialog 
            options={sortOptionsByCategory[category as keyof typeof sortOptionsByCategory]} 
            onSort={setSortValue}
          />
        </div>
        
        {sortValue && (
          <p className="text-sm text-muted-foreground">
            Sorting {category} by: {sortValue}
          </p>
        )}
      </div>
    );
  },
};