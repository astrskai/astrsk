import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import React from "react";

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell className="text-right">$350.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithFooter: Story = {
  args: {},
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell className="text-right">$350.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const WithBadges: Story = {
  args: {},
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Complete project documentation</TableCell>
          <TableCell>
            <Badge variant="outline">In Progress</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="destructive">High</Badge>
          </TableCell>
          <TableCell>2024-03-15</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Review pull requests</TableCell>
          <TableCell>
            <Badge variant="secondary">Pending</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="default">Medium</Badge>
          </TableCell>
          <TableCell>2024-03-12</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Update dependencies</TableCell>
          <TableCell>
            <Badge variant="default">Completed</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline">Low</Badge>
          </TableCell>
          <TableCell>2024-03-10</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const UserTable: Story = {
  args: {},
  render: () => {
    const users = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "Admin",
        status: "Active",
        lastLogin: "2 hours ago",
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        role: "Editor",
        status: "Active",
        lastLogin: "5 minutes ago",
      },
      {
        id: 3,
        name: "Bob Johnson",
        email: "bob@example.com",
        role: "Viewer",
        status: "Inactive",
        lastLogin: "3 days ago",
      },
      {
        id: 4,
        name: "Alice Brown",
        email: "alice@example.com",
        role: "Editor",
        status: "Active",
        lastLogin: "1 day ago",
      },
    ];

    return (
      <Table>
        <TableCaption>A list of users in your organization.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

export const ProductTable: Story = {
  args: {},
  render: () => {
    const products = [
      { id: 1, name: "Laptop Pro", category: "Electronics", price: "$1,299", stock: 15, status: "In Stock" },
      { id: 2, name: "Wireless Mouse", category: "Accessories", price: "$49", stock: 0, status: "Out of Stock" },
      { id: 3, name: "USB-C Hub", category: "Accessories", price: "$79", stock: 23, status: "In Stock" },
      { id: 4, name: "Monitor 4K", category: "Electronics", price: "$599", stock: 5, status: "Low Stock" },
      { id: 5, name: "Keyboard Mechanical", category: "Accessories", price: "$129", stock: 18, status: "In Stock" },
    ];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.price}</TableCell>
              <TableCell className="text-center">{product.stock}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    product.status === "In Stock"
                      ? "default"
                      : product.status === "Low Stock"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {product.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

export const TransactionTable: Story = {
  args: {},
  render: () => {
    const transactions = [
      { date: "2024-03-10", description: "Payment from Client A", type: "Credit", amount: "+$1,500.00", balance: "$5,500.00" },
      { date: "2024-03-09", description: "Office Supplies", type: "Debit", amount: "-$150.00", balance: "$4,000.00" },
      { date: "2024-03-08", description: "Payment from Client B", type: "Credit", amount: "+$2,000.00", balance: "$4,150.00" },
      { date: "2024-03-07", description: "Software License", type: "Debit", amount: "-$99.00", balance: "$2,150.00" },
      { date: "2024-03-06", description: "Freelance Project", type: "Credit", amount: "+$800.00", balance: "$2,249.00" },
    ];

    return (
      <Table>
        <TableCaption>Recent transactions for your account.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={index}>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <Badge variant={transaction.type === "Credit" ? "default" : "secondary"}>
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell className={cn(
                "text-right font-medium",
                transaction.type === "Credit" ? "text-green-600" : "text-red-600"
              )}>
                {transaction.amount}
              </TableCell>
              <TableCell className="text-right">{transaction.balance}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

export const SelectableRows: Story = {
  args: {},
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<number[]>([]);

    const data = [
      { id: 1, name: "Item 1", value: "$100" },
      { id: 2, name: "Item 2", value: "$200" },
      { id: 3, name: "Item 3", value: "$300" },
      { id: 4, name: "Item 4", value: "$400" },
    ];

    const toggleRow = (id: number) => {
      setSelectedRows(prev =>
        prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
      );
    };

    const toggleAll = () => {
      setSelectedRows(prev =>
        prev.length === data.length ? [] : data.map(item => item.id)
      );
    };

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length}
                onChange={toggleAll}
                className="cursor-pointer"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              data-state={selectedRows.includes(item.id) ? "selected" : undefined}
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(item.id)}
                  onChange={() => toggleRow(item.id)}
                  className="cursor-pointer"
                />
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {selectedRows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>
                {selectedRows.length} row{selectedRows.length > 1 ? "s" : ""} selected
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    );
  },
};

export const ComplexTable: Story = {
  args: {},
  render: () => {
    const employees = [
      {
        id: 1,
        avatar: "JD",
        name: "John Doe",
        position: "Software Engineer",
        department: "Engineering",
        email: "john.doe@company.com",
        phone: "+1 234 567 890",
        salary: "$120,000",
        startDate: "2021-03-15",
        performance: "Excellent",
      },
      {
        id: 2,
        avatar: "JS",
        name: "Jane Smith",
        position: "Product Manager",
        department: "Product",
        email: "jane.smith@company.com",
        phone: "+1 234 567 891",
        salary: "$130,000",
        startDate: "2020-07-01",
        performance: "Good",
      },
      {
        id: 3,
        avatar: "BJ",
        name: "Bob Johnson",
        position: "UX Designer",
        department: "Design",
        email: "bob.johnson@company.com",
        phone: "+1 234 567 892",
        salary: "$95,000",
        startDate: "2022-01-10",
        performance: "Excellent",
      },
    ];

    return (
      <div className="w-full">
        <Table>
          <TableCaption>Employee information and performance data.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {employee.avatar}
                    </div>
                    <span className="font-medium">{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{employee.email}</div>
                    <div className="text-muted-foreground">{employee.phone}</div>
                  </div>
                </TableCell>
                <TableCell>{employee.salary}</TableCell>
                <TableCell>{employee.startDate}</TableCell>
                <TableCell>
                  <Badge
                    variant={employee.performance === "Excellent" ? "default" : "secondary"}
                  >
                    {employee.performance}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

export const EmptyState: Story = {
  args: {},
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            <div className="text-muted-foreground">
              No data available
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};