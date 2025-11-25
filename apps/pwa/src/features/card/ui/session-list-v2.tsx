import React, { useState } from "react";
import {
  MessageSquare,
  User,
  Scroll,
  Dices,
  MoreHorizontal,
  Clock,
  Layers,
  Image as ImageIcon,
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
  Calendar,
  PlayCircle,
  Archive,
  Download,
  Copy,
  Trash2,
  PanelLeft,
  Menu,
  X,
  Play,
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
  color?: "gray" | "orange" | "blue" | "purple" | "green" | "red";
}) => {
  const colors = {
    gray: "bg-zinc-800 text-zinc-400 border border-zinc-700",
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
  <div className="absolute top-2 right-2 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 opacity-100 backdrop-blur-md transition-all duration-300 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
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

// --- Left Sidebar (Collapsible & Responsive) ---
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
  const [isDark, setIsDark] = useState(true); // Default to Dark Mode

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "md:w-20" : "md:w-64"} w-64`}
      >
        {/* Sidebar Header */}
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

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden text-zinc-500 transition-colors hover:text-white md:block"
          >
            <PanelLeft size={16} />
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileMenu}
            className="block text-zinc-500 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action: Create Button (with Hover Popover) - Hidden on Mobile */}
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

          {/* Popover Menu */}
          <div
            className={`invisible absolute flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100 ${
              isCollapsed
                ? "top-2 left-16 ml-2 w-48 origin-top-left" // Flyout for collapsed state
                : "top-14 right-4 left-4 origin-top" // Dropdown for expanded state
            }`}
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

        {/* Navigation Sections */}
        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto px-2 py-2">
          {/* Play Category */}
          <div className="mb-6 space-y-1">
            <div
              className={`mb-2 px-2 text-[10px] font-bold tracking-widest whitespace-nowrap text-zinc-600 uppercase transition-all duration-300 ${isCollapsed ? "h-0 overflow-hidden text-center opacity-0" : "opacity-100"}`}
            >
              Play
            </div>
            <NavItem
              icon={Play}
              label="Play"
              active
              badge={4}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Assets Category */}
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
              badge={8}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Push Settings to Bottom */}
          <div className="mt-auto">
            <NavItem
              icon={Settings}
              label="Settings"
              isCollapsed={isCollapsed}
            />
          </div>
        </div>

        {/* Footer (With Theme Toggle) */}
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

              {/* Logged Out Utility Row (Hidden when Collapsed) */}
              <div
                className={`flex items-center justify-between px-1 ${isCollapsed ? "hidden" : "flex"}`}
              >
                <span className="font-mono text-[10px] text-zinc-600">
                  v2.0.4
                </span>
                <button
                  onClick={toggleTheme}
                  className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                  title={
                    isDark ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
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

              {/* Logged In Actions (Hidden when Collapsed) */}
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

// --- Session Card Component ---
const SessionCard = ({ session }: { session: any }) => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-xl">
      {/* Header Image Area */}
      <div className="relative h-40 overflow-hidden bg-zinc-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${session.image}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            color={
              session.status === "Active"
                ? "green"
                : session.status === "Archived"
                  ? "gray"
                  : "blue"
            }
          >
            {session.status}
          </Badge>
        </div>

        {/* System Tag */}
        <div className="absolute top-3 left-3">
          <span className="rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">
            {session.system}
          </span>
        </div>

        {/* Responsive Toolbar added to Image Area */}
        <ActionToolbar />

        <div className="absolute bottom-0 left-0 w-full p-4">
          <h2 className="mb-0.5 truncate pr-2 text-lg leading-tight font-bold text-white">
            {session.title}
          </h2>
          <p className="truncate text-xs text-zinc-400">{session.scenario}</p>
        </div>
      </div>

      {/* Session Details */}
      <div className="flex flex-grow flex-col justify-between p-4">
        <div className="space-y-4">
          {/* Progress / Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock size={12} className="text-zinc-500" />
              <span>{session.playtime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <MessageSquare size={12} className="text-zinc-500" />
              <span>{session.messages} msgs</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            <div className="flex -space-x-2">
              {session.players.map((p: string, i: number) => (
                <div
                  key={i}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-900 bg-zinc-700 text-[10px] text-zinc-300 ring-2 ring-zinc-900"
                >
                  {p}
                </div>
              ))}
              {session.playerCount > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-900 bg-zinc-800 text-[8px] text-zinc-500 ring-2 ring-zinc-900">
                  +{session.playerCount - 3}
                </div>
              )}
            </div>
            <button className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Footer Action - Responsive Visibility */}
        <div className="mt-4 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
          <button className="flex w-full items-center justify-center gap-2 rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500">
            <PlayCircle size={14} /> Resume Session
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Mock Data ---
const SESSIONS = [
  {
    id: 1,
    title: "Sakura Blooms, Hearts Awaken",
    scenario: "Spring Festival Arc",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    status: "Active",
    system: "Visual Novel",
    playtime: "12h 30m",
    messages: "1.2k",
    players: ["A", "B", "Y"],
    playerCount: 3,
  },
  {
    id: 2,
    title: "The Neon Syndicate",
    scenario: "Cyberpunk Heist",
    image:
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2670&auto=format&fit=crop",
    status: "Active",
    system: "D20 Modern",
    playtime: "4h 15m",
    messages: "450",
    players: ["K", "R"],
    playerCount: 2,
  },
  {
    id: 3,
    title: "Echoes of the Void",
    scenario: "Space Horror One-Shot",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop",
    status: "Planned",
    system: "Sci-Fi Horror",
    playtime: "0m",
    messages: "0",
    players: [],
    playerCount: 0,
  },
  {
    id: 4,
    title: "Kingdom of Ash",
    scenario: "Campaign Finale",
    image:
      "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2574&auto=format&fit=crop",
    status: "Archived",
    system: "Fantasy 5e",
    playtime: "48h 10m",
    messages: "5.4k",
    players: ["G", "L", "M", "P"],
    playerCount: 5,
  },
  {
    id: 5,
    title: "Coffee Shop Alternate Universe",
    scenario: "Slice of Life",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop",
    status: "Active",
    system: "Freeform",
    playtime: "2h 45m",
    messages: "230",
    players: ["A"],
    playerCount: 1,
  },
  {
    id: 6,
    title: "Project: Chimera",
    scenario: "Secret Lab Escape",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=3540&auto=format&fit=crop",
    status: "Archived",
    system: "Sci-Fi",
    playtime: "6h 20m",
    messages: "890",
    players: ["Z", "X"],
    playerCount: 2,
  },
];

// --- Main Page Component ---
export default function SessionList() {
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredSessions =
    activeTab === "All"
      ? SESSIONS
      : SESSIONS.filter((s) => s.status === activeTab);

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
          {/* Header Section (Redesigned) */}
          <div className="flex-shrink-0 border-b border-zinc-800 bg-black p-4 md:p-8">
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Top Row: Title & Primary Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white md:text-3xl">
                    Sessions
                  </h1>
                  <p className="mt-1 hidden text-zinc-500 md:block">
                    Manage your active campaigns.
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
                  <button className="flex h-8 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95 md:h-9 md:px-4">
                    <Plus size={14} />
                    <span>Create</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row: Search & Sort Toolbar */}
              <div className="flex items-center gap-2 md:border-t md:border-zinc-800 md:pt-6">
                {/* Search Input (Expands) */}
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 pr-4 pl-9 text-sm text-zinc-200 placeholder-zinc-600 transition-all focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 focus:outline-none md:h-10"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="flex h-9 items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2 transition-colors hover:border-zinc-700 md:h-10 md:px-3">
                  <span className="mr-2 hidden text-xs font-bold tracking-wider text-zinc-500 uppercase md:block">
                    Sort:
                  </span>
                  <select className="max-w-[80px] cursor-pointer bg-transparent text-sm font-medium text-zinc-300 focus:outline-none md:max-w-none">
                    <option>Newest</option>
                    <option>Oldest</option>
                    <option>Name</option>
                  </select>
                </div>

                {/* View Mode Toggle (Hidden on Mobile for simplicity) */}
                <div className="hidden h-10 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 md:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-full rounded px-2 transition-colors ${viewMode === "grid" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                    title="Grid View"
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-full rounded px-2 transition-colors ${viewMode === "list" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="p-4 md:p-8">
            {/* Grid View */}
            {viewMode === "grid" ? (
              // MODIFIED GRID LAYOUT: Uses auto-fill with minmax to ensure stable card sizes
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                {filteredSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}

                {/* "Create New" Placeholder Card */}
                <button className="group flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-transparent transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-600 shadow-lg transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300">
                    Create New Session
                  </span>
                </button>
              </div>
            ) : (
              // List View (Simple Implementation)
              <div className="flex flex-col gap-2">
                <div className="hidden grid-cols-12 gap-4 border-b border-zinc-800 px-4 py-2 text-xs font-bold tracking-wider text-zinc-600 uppercase md:grid">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">System</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Last Played</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group grid grid-cols-1 items-center gap-4 rounded-lg border border-transparent bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900 md:grid-cols-12"
                  >
                    <div className="col-span-1 flex items-center gap-3 md:col-span-5">
                      <div
                        className="h-8 w-8 flex-shrink-0 rounded bg-zinc-800 bg-cover bg-center"
                        style={{ backgroundImage: `url('${session.image}')` }}
                      ></div>
                      <div className="overflow-hidden">
                        <div className="truncate font-bold text-zinc-200">
                          {session.title}
                        </div>
                        <div className="truncate text-xs text-zinc-500">
                          {session.scenario}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-between md:col-span-2 md:justify-start">
                      <span className="mr-2 text-xs font-bold text-zinc-500 uppercase md:hidden">
                        System:
                      </span>
                      <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                        {session.system}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-between md:col-span-2 md:justify-start">
                      <span className="mr-2 text-xs font-bold text-zinc-500 uppercase md:hidden">
                        Status:
                      </span>
                      <span
                        className={`text-xs ${session.status === "Active" ? "text-green-400" : "text-zinc-500"}`}
                      >
                        ● {session.status}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-between text-xs text-zinc-400 md:col-span-2 md:justify-start">
                      <span className="mr-2 font-bold text-zinc-500 uppercase md:hidden">
                        Played:
                      </span>
                      2 hours ago
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button className="p-1 text-zinc-500 hover:text-white">
                        <MoreHorizontal size={16} />
                      </button>
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
