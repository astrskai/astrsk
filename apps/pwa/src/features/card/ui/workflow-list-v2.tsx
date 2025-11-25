import React, { useState } from "react";
import {
  Dices,
  MoreHorizontal,
  Clock,
  Hash,
  Home,
  Settings,
  Plus,
  Search,
  Command,
  Library,
  Sparkles,
  LogOut,
  Filter,
  Grid,
  List,
  Download,
  Copy,
  Trash2,
  PanelLeft,
  Menu,
  X,
  Play,
  User,
  Scroll,
  Layers,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Sun,
  Moon,
  Upload,
} from "lucide-react";

// --- Reusable UI Elements ---
const Badge = ({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "orange" | "blue" | "purple" | "green" | "red" | "zinc";
}) => {
  const colors = {
    gray: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    zinc: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    orange: "bg-orange-950/50 text-orange-400 border border-orange-900/50",
    blue: "bg-blue-950/50 text-blue-400 border border-blue-900/50",
    purple: "bg-purple-950/50 text-purple-400 border border-purple-900/50",
    green: "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50",
    red: "bg-red-950/50 text-red-400 border border-red-900/50",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${colors[color]} tracking-wider uppercase`}
    >
      {children}
    </span>
  );
};

// --- Action Toolbar ---
const ActionToolbar = () => (
  <div className="absolute top-3 right-3 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-zinc-900/90 p-1 opacity-100 shadow-xl backdrop-blur-md transition-all duration-300 lg:translate-y-[-5px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
    <button
      className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      title="Export Package"
    >
      <Download size={14} />
    </button>
    <button
      className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      title="Duplicate"
    >
      <Copy size={14} />
    </button>
    <div className="mx-0.5 h-4 w-px bg-white/10"></div>
    <button
      className="rounded p-1.5 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
      title="Delete Asset"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

// --- Sidebar Items ---
const NavItem = ({
  icon: Icon,
  label,
  active = false,
  badge,
  isCollapsed = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: number;
  isCollapsed?: boolean;
}) => {
  return (
    <button
      className={`group relative flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${isCollapsed ? "w-full justify-center" : "w-full justify-between"} ${
        active
          ? "border-zinc-700 bg-zinc-800 text-white shadow-sm"
          : "border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      }`}
    >
      <div
        className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
      >
        <Icon
          size={16}
          className={`flex-shrink-0 transition-colors ${
            active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
          }`}
        />
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
        >
          {label}
        </span>
      </div>

      {badge &&
        (isCollapsed ? (
          <span className="absolute top-1.5 right-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-500"></span>
          </span>
        ) : (
          <span
            className={`flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[10px] ${active ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-500"}`}
          >
            {badge}
          </span>
        ))}
    </button>
  );
};

// --- Popover Item Helper ---
const CreateMenuItem = ({
  icon: Icon,
  label,
  colorClass,
}: {
  icon: any;
  label: string;
  colorClass: string;
}) => (
  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white">
    <Icon size={16} className={colorClass} />
    <span>{label}</span>
  </button>
);

// --- Left Sidebar ---
const Sidebar = ({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  closeMobileMenu,
}: {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "md:w-20" : "md:w-64"} w-64`}
      >
        <div
          className={`flex h-16 items-center border-b border-zinc-800 px-4 transition-all ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "hidden" : "flex"}`}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <span className="text-sm font-bold tracking-wide whitespace-nowrap text-zinc-100">
              NEXUS<span className="text-zinc-600">.AI</span>
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden text-zinc-500 transition-colors hover:text-white md:block"
          >
            <PanelLeft size={16} />
          </button>
          <button
            onClick={closeMobileMenu}
            className="block text-zinc-500 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="group relative z-50 hidden border-b border-transparent p-4 md:block">
          <div
            className={`flex w-full cursor-default items-center gap-2 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-900 transition-all duration-300 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-indigo-500/20 ${isCollapsed ? "justify-center px-0" : "justify-center"}`}
          >
            <Sparkles
              size={16}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100"}`}
            >
              Create
            </span>
          </div>
          <div
            className={`invisible absolute flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100 ${isCollapsed ? "top-2 left-16 ml-2 w-48 origin-top-left" : "top-14 right-4 left-4 origin-top"}`}
          >
            <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase">
              Create New
            </div>
            <CreateMenuItem
              icon={Layers}
              label="Session"
              colorClass="text-indigo-400"
            />
            <CreateMenuItem
              icon={User}
              label="Character"
              colorClass="text-orange-400"
            />
            <CreateMenuItem
              icon={Scroll}
              label="Scenario"
              colorClass="text-purple-400"
            />
            <CreateMenuItem
              icon={Dices}
              label="Workflow"
              colorClass="text-blue-400"
            />
          </div>
        </div>

        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto px-2 py-2">
          <div className="mb-6 space-y-1">
            <div
              className={`mb-2 px-2 text-[10px] font-bold tracking-widest whitespace-nowrap text-zinc-600 uppercase transition-all duration-300 ${isCollapsed ? "h-0 overflow-hidden text-center opacity-0" : "opacity-100"}`}
            >
              Play
            </div>
            <NavItem
              icon={Play}
              label="Play"
              badge={4}
              isCollapsed={isCollapsed}
            />
          </div>
          <div className="mb-6 space-y-1">
            <div
              className={`mb-2 px-2 text-[10px] font-bold tracking-widest whitespace-nowrap text-zinc-600 uppercase transition-all duration-300 ${isCollapsed ? "h-0 overflow-hidden text-center opacity-0" : "opacity-100"}`}
            >
              Assets
            </div>
            <NavItem
              icon={User}
              label="Characters"
              badge={12}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={Scroll}
              label="Scenarios"
              badge={5}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={Dices}
              label="Workflows"
              active
              badge={8}
              isCollapsed={isCollapsed}
            />
          </div>
          <div className="mt-auto">
            <NavItem
              icon={Settings}
              label="Settings"
              isCollapsed={isCollapsed}
            />
          </div>
        </div>

        <div className="border-t border-zinc-800 p-4">
          {!isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleLogin}
                className={`flex w-full items-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95 ${isCollapsed ? "justify-center px-0" : "justify-center px-4"}`}
                title="Log In"
              >
                <LogIn size={18} />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100"}`}
                >
                  Log In
                </span>
              </button>
              <div
                className={`flex items-center justify-between px-1 ${isCollapsed ? "hidden" : "flex"}`}
              >
                <span className="font-mono text-[10px] text-zinc-600">
                  v2.0.4
                </span>
                <button
                  onClick={toggleTheme}
                  className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    alt="User"
                  />
                </div>
                <div
                  className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100"}`}
                >
                  <h4 className="truncate text-sm font-medium text-zinc-200">
                    Creator One
                  </h4>
                  <p className="truncate text-xs text-zinc-500">Free Plan</p>
                </div>
              </div>
              <div
                className={`flex items-center ${isCollapsed ? "hidden" : "flex"}`}
              >
                <button
                  onClick={toggleTheme}
                  className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                  title="Log Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- Workflow Card Component (Text-Based Design) ---
const WorkflowGridItem = ({ workflow }: { workflow: any }) => {
  return (
    <div className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50 hover:shadow-md">
      {/* Action Toolbar (Positioned Absolute Top Right) */}
      <div className="absolute top-3 right-3 z-20">
        <ActionToolbar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col p-5">
        {/* Top Row: Type Indicator */}
        <div className="mb-3">
          <div className="inline-flex items-center gap-1.5 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400">
            <Dices size={12} />
            WORKFLOW
          </div>
        </div>

        {/* Title */}
        <div className="mb-1 pr-6">
          <h3 className="truncate text-lg leading-tight font-bold text-zinc-100 transition-colors group-hover:text-white">
            {workflow.title}
          </h3>
        </div>

        {/* Version & Status */}
        <div className="mb-4 flex items-center gap-2">
          <Badge color="blue">v{workflow.version}</Badge>
          <span className="font-mono text-[10px] text-zinc-500">
            {workflow.isValid ? "Valid" : "Draft"}
          </span>
        </div>

        {/* Description */}
        <p className="mb-5 line-clamp-3 min-h-[3rem] text-xs leading-relaxed text-zinc-400">
          {workflow.description}
        </p>

        {/* Footer Stats & Tags */}
        <div className="mt-auto flex flex-col gap-3 border-t border-zinc-800/50 pt-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {workflow.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded border border-zinc-800 bg-zinc-800/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors group-hover:border-zinc-700"
              >
                #{tag}
              </span>
            ))}
            {workflow.tags.length > 3 && (
              <span className="rounded px-1.5 py-0.5 text-[10px] text-zinc-600">
                +{workflow.tags.length - 3}
              </span>
            )}
          </div>

          {/* Meta Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 transition-colors group-hover:text-zinc-400">
              <GitBranch size={12} />
              <span>{workflow.nodes} Nodes</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${workflow.isValid ? "text-emerald-500" : "text-amber-500"}`}
            >
              {workflow.isValid ? (
                <CheckCircle2 size={12} />
              ) : (
                <AlertCircle size={12} />
              )}
              <span>{workflow.isValid ? "Ready" : "Issues Found"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="mt-auto h-0.5 w-full rounded-b-xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
    </div>
  );
};

// --- Mock Data ---
const WORKFLOWS = [
  {
    id: 1,
    title: "Dice of Fate",
    version: "2.1",
    description:
      "Randomizes outcome of skill checks during dialogue based on d20 ruleset.",
    tags: ["RNG", "D&D", "Logic"],
    nodes: 14,
    isValid: true,
  },
  {
    id: 2,
    title: "Inventory Manager",
    version: "1.0.4",
    description:
      "Handles adding, removing, and checking for items in the character's inventory array.",
    tags: ["System", "Database"],
    nodes: 28,
    isValid: true,
  },
  {
    id: 3,
    title: "Combat Loop (Turn Based)",
    version: "0.9-beta",
    description:
      "Complex state machine for managing turn order, HP tracking, and action economy.",
    tags: ["Combat", "Complex"],
    nodes: 142,
    isValid: false,
  },
  {
    id: 4,
    title: "NPC Relationship Tracker",
    version: "3.0",
    description:
      "Updates affection points based on dialogue choices and triggers romance events.",
    tags: ["Social", "Event"],
    nodes: 45,
    isValid: true,
  },
  {
    id: 5,
    title: "Weather System",
    version: "1.1",
    description:
      "Periodically changes the environment variable description based on region.",
    tags: ["Atmosphere", "Background"],
    nodes: 8,
    isValid: true,
  },
  {
    id: 6,
    title: "Quest: The Lost Key",
    version: "1.0",
    description:
      "Linear quest logic for checking flags and updating journal entries.",
    tags: ["Quest", "Story"],
    nodes: 12,
    isValid: true,
  },
];

// --- Main Page Component ---
export default function WorkflowList() {
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter Logic (Mock)
  const filteredWorkflows = activeTab === "All" ? WORKFLOWS : WORKFLOWS; // Simplified for demo

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans text-zinc-200">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-zinc-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <span className="font-bold text-zinc-100">NEXUS.AI</span>
            </div>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User"
            />
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Header Section */}
          <div className="flex-shrink-0 border-b border-zinc-800 bg-black p-4 md:p-8">
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white md:text-3xl">
                    Workflows
                  </h1>
                  <p className="mt-1 hidden text-zinc-500 md:block">
                    Design logic, rules, and state machines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white md:h-9 md:w-auto md:gap-2 md:px-4"
                    title="Import"
                  >
                    <Upload size={14} />
                    <span className="hidden md:inline">Import</span>
                  </button>
                  <button className="flex h-8 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95 md:h-9 md:px-4">
                    <Plus size={14} />
                    <span>Create</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center gap-2 md:border-t md:border-zinc-800 md:pt-6">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 pr-4 pl-9 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none md:h-10"
                  />
                </div>
                <div className="flex h-9 items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2 transition-colors hover:border-zinc-700 md:h-10 md:px-3">
                  <span className="mr-2 hidden text-xs font-bold tracking-wider text-zinc-500 uppercase md:block">
                    Sort:
                  </span>
                  <select className="max-w-[80px] cursor-pointer bg-transparent text-sm font-medium text-zinc-300 focus:outline-none md:max-w-none">
                    <option>Newest</option>
                    <option>Name</option>
                    <option>Complexity</option>
                  </select>
                </div>
                <div className="hidden h-10 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 md:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-full rounded px-2 transition-colors ${viewMode === "grid" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-full rounded px-2 transition-colors ${viewMode === "list" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="p-4 md:p-8">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                {filteredWorkflows.map((wf) => (
                  <WorkflowGridItem key={wf.id} workflow={wf} />
                ))}
                {/* Placeholder Card */}
                <button className="group flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-transparent transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-600 shadow-lg transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300">
                    Create New Workflow
                  </span>
                </button>
              </div>
            ) : (
              // List View
              <div className="flex flex-col gap-2">
                <div className="hidden grid-cols-12 gap-4 border-b border-zinc-800 px-4 py-2 text-xs font-bold tracking-wider text-zinc-600 uppercase md:grid">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Tags</div>
                  <div className="col-span-2">Complexity</div>
                </div>
                {filteredWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="group grid grid-cols-1 items-center gap-4 rounded-lg border border-transparent bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900 md:grid-cols-12"
                  >
                    <div className="col-span-1 flex items-center gap-3 md:col-span-5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-blue-900/50 bg-blue-900/20 text-blue-500">
                        <GitBranch size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="truncate font-bold text-zinc-200">
                          {wf.title}
                        </div>
                        <div className="font-mono text-xs text-zinc-500">
                          v{wf.version}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      {wf.isValid ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle2 size={12} /> Valid
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-red-400">
                          <AlertCircle size={12} /> Error
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 flex flex-wrap gap-1 md:col-span-3">
                      {wf.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div className="col-span-1 text-xs text-zinc-500 md:col-span-2">
                      {wf.nodes} Nodes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
