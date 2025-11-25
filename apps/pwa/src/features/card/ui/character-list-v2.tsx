import React, { useState } from "react";
import {
  MessageSquare,
  User,
  Users,
  Scroll,
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
  Grid,
  List,
  Shield,
  Sword,
  Ghost,
  Smile,
  BrainCircuit,
  Filter,
  Layers,
  Download,
  Copy,
  Trash2,
  PanelLeft,
  Menu,
  X,
  ChevronRight,
  Play,
  LogIn,
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

// --- Sidebar Items (Simplified Color Palette) ---
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
  // Simplified color palette:
  // Active: Zinc-800 bg, White text
  // Inactive: Transparent bg, Zinc-500 text (hover: Zinc-900 bg, Zinc-300 text)

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

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
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
              active
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

        {/* Login / User Footer */}
        <div className="border-t border-zinc-800 p-4">
          {!isLoggedIn ? (
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
          ) : (
            <div
              className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
            >
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
              <button
                onClick={handleLogout}
                className={`text-zinc-500 hover:text-zinc-300 ${isCollapsed ? "hidden" : "block"}`}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          {/* Version Info */}
          <div
            className={`mt-4 text-center text-[10px] text-zinc-600 ${isCollapsed ? "hidden" : "block"}`}
          >
            v2.0.4
          </div>
        </div>
      </div>
    </>
  );
};

// --- Character Card (Grid View) ---
const CharacterGridItem = ({ char }: { char: any }) => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-xl">
      {/* Portrait Area */}
      <div className="relative h-64 overflow-hidden bg-zinc-800">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('${char.image}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"></div>

        {/* Role Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {char.role === "Protagonist" && (
              <Sword size={12} className="text-orange-400" />
            )}
            {char.role === "NPC" && (
              <Smile size={12} className="text-blue-400" />
            )}
            {char.role === "Antagonist" && (
              <Ghost size={12} className="text-red-400" />
            )}
            {char.role.toUpperCase()}
          </div>
        </div>

        <ActionToolbar />
      </div>

      <div className="relative z-10 -mt-16 flex flex-grow flex-col p-4">
        <h3 className="mb-1 truncate text-xl font-bold text-white drop-shadow-md">
          {char.name}
        </h3>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {char.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300 backdrop-blur-sm"
            >
              #{tag}
            </span>
          ))}
        </div>

        <p className="mb-4 line-clamp-3 min-h-[3rem] text-xs leading-relaxed text-zinc-400">
          {char.summary}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          <div
            className="flex items-center gap-1.5"
            title="Total Memory Tokens"
          >
            <BrainCircuit size={12} className="text-zinc-600" />
            <span>{char.tokens}t</span>
          </div>
          <div className="flex items-center gap-1.5" title="Last Updated">
            <Clock size={12} className="text-zinc-600" />
            <span>{char.updated}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Mock Data ---
const CHARACTERS = [
  {
    id: 1,
    name: "Sakuraba Yui",
    role: "NPC",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop",
    tags: ["shy", "student", "musician"],
    summary:
      "A gentle classmate who secretly loves gardening and heavy metal music. She struggles to express her true feelings.",
    tokens: 573,
    updated: "2d ago",
  },
  {
    id: 2,
    name: "Kaelthas Sunstrider",
    role: "Antagonist",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3387&auto=format&fit=crop",
    tags: ["mage", "royal", "corrupted"],
    summary:
      "The fallen prince of a destroyed kingdom. Driven by a thirst for magical power, he seeks to reclaim his birthright at any cost.",
    tokens: 1420,
    updated: "5h ago",
  },
  {
    id: 3,
    name: "Detective Miller",
    role: "Protagonist",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3387&auto=format&fit=crop",
    tags: ["noir", "investigator", "cybernetic"],
    summary:
      "A washed-up detective with a cybernetic eye. He sees things others can't, but wishes he couldn't see anything at all.",
    tokens: 890,
    updated: "1w ago",
  },
  {
    id: 4,
    name: "Unit 734 (Echo)",
    role: "NPC",
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=2550&auto=format&fit=crop",
    tags: ["robot", "assistant", "glitched"],
    summary:
      "A service droid that has begun to develop consciousness. It hides its sentience from the corporation that owns it.",
    tokens: 450,
    updated: "3d ago",
  },
  {
    id: 5,
    name: "Lady Vane",
    role: "Antagonist",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=3388&auto=format&fit=crop",
    tags: ["vampire", "noble", "manipulator"],
    summary:
      "Ancient vampire ruling the city's underworld from her high-rise penthouse. Charming, deadly, and bored.",
    tokens: 2100,
    updated: "1mo ago",
  },
  {
    id: 6,
    name: "Rook",
    role: "Protagonist",
    image:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=3387&auto=format&fit=crop",
    tags: ["soldier", "mercenary", "stoic"],
    summary:
      "A heavy weapons specialist who speaks little but carries a big gun. Loyal to the highest bidder, until now.",
    tokens: 600,
    updated: "2d ago",
  },
  {
    id: 7,
    name: "Elara Moonwhisper",
    role: "NPC",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=3387&auto=format&fit=crop",
    tags: ["elf", "healer", "pacifist"],
    summary:
      "A forest dweller who tends to the wounded regardless of their allegiance. She holds the secret to the ancient grove.",
    tokens: 720,
    updated: "4h ago",
  },
  {
    id: 8,
    name: "Cipher",
    role: "NPC",
    image:
      "https://images.unsplash.com/photo-1488161628813-99c974c0efe0?q=80&w=3387&auto=format&fit=crop",
    tags: ["hacker", "informant", "paranoid"],
    summary:
      "Operates out of a basement full of servers. Knows everything that happens on the net, but is terrified of the outside world.",
    tokens: 550,
    updated: "6d ago",
  },
];

// --- Main Page Component ---
export default function CharacterList() {
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredCharacters =
    activeTab === "All"
      ? CHARACTERS
      : CHARACTERS.filter((c) => c.role === activeTab);

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
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                <span>Home</span>
                <ChevronRight size={12} />
                <span>Characters</span>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white">Characters</h1>
              <p className="text-zinc-500">
                Design, fine-tune, and manage your AI personas.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white">
                <Users size={16} /> Bulk Edit
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-900/20 transition-all hover:bg-orange-500 active:scale-95">
                <Plus size={16} /> Create Character
              </button>
            </div>
          </div>

          {/* Toolbar: Tabs & Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Tabs */}
            <div className="scrollbar-hide flex gap-6 overflow-x-auto pb-2 md:pb-0">
              {["All", "Protagonist", "NPC", "Antagonist"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "text-orange-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                  )}
                </button>
              ))}
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter tags..."
                  className="w-40 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none"
                />
                <Filter
                  size={10}
                  className="absolute top-1.5 right-2 text-zinc-500"
                />
              </div>

              <div className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded p-1.5 transition-colors ${viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded p-1.5 transition-colors ${viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map((char) => (
                <CharacterGridItem key={char.id} char={char} />
              ))}
            </div>
          ) : (
            // List View (Detailed Table)
            <div className="flex flex-col gap-2">
              <div className="hidden grid-cols-12 gap-4 border-b border-zinc-800 px-4 py-2 text-xs font-bold tracking-wider text-zinc-600 uppercase md:grid">
                <div className="col-span-4">Identity</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-3">Tags</div>
                <div className="col-span-2">Stats</div>
                <div className="col-span-1 text-right"></div>
              </div>
              {filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className="group grid grid-cols-1 items-center gap-4 rounded-lg border border-transparent bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900 md:grid-cols-12"
                >
                  <div className="col-span-1 flex items-center gap-3 md:col-span-4">
                    <div
                      className="h-10 w-10 flex-shrink-0 rounded-full border border-zinc-700 bg-zinc-800 bg-cover bg-center"
                      style={{ backgroundImage: `url('${char.image}')` }}
                    ></div>
                    <div className="overflow-hidden">
                      <div className="truncate font-bold text-zinc-200">
                        {char.name}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {char.summary}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-between md:col-span-2 md:justify-start">
                    <span className="mr-2 text-xs font-bold text-zinc-500 uppercase md:hidden">
                      Role:
                    </span>
                    <Badge
                      color={
                        char.role === "Antagonist"
                          ? "red"
                          : char.role === "Protagonist"
                            ? "orange"
                            : "blue"
                      }
                    >
                      {char.role}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex flex-wrap gap-1 md:col-span-3">
                    {char.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                      >
                        #{t}
                      </span>
                    ))}
                    {char.tags.length > 2 && (
                      <span className="text-[10px] text-zinc-500">
                        +{char.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex flex-row gap-4 text-xs text-zinc-500 md:col-span-2 md:flex-col md:gap-0.5">
                    <span className="flex items-center gap-1">
                      <BrainCircuit size={10} /> {char.tokens} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {char.updated}
                    </span>
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
  );
}
