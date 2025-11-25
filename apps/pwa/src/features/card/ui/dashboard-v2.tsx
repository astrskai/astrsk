import React, { useState } from "react";
import {
  MessageSquare,
  User,
  Scroll,
  Dices,
  MoreHorizontal,
  Clock,
  Hash,
  Play,
  Layers,
  GitBranch,
  Image as ImageIcon,
  Home,
  Settings,
  Plus,
  Search,
  Command,
  ChevronRight,
  Library,
  Sparkles,
  LogOut,
  Download,
  Copy,
  Trash2,
  PanelLeft,
  Menu,
  X,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Terminal,
  Clipboard,
  Sun,
  Moon,
} from "lucide-react";
import { Toaster, toast } from "sonner";

// --- ERROR DETAILS DIALOG ---
const ErrorDetailDialog = ({
  isOpen,
  onClose,
  errorData,
}: {
  isOpen: boolean;
  onClose: () => void;
  errorData: any;
}) => {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 w-full max-w-lg rounded-xl border border-red-900/50 bg-zinc-950 shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-900/20 text-red-500">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Error Details</h3>
              <p className="text-xs text-zinc-500">Review technical logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-900/30 bg-red-950/30 p-3">
            <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-200">
                {errorData.message}
              </p>
              <p className="font-mono text-xs text-red-400/70">
                Code: {errorData.code}
              </p>
            </div>
          </div>
          <div className="relative rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="absolute top-3 right-3">
              <button
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                title="Copy Stack"
              >
                <Clipboard size={14} />
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-[10px] leading-relaxed text-zinc-400">
              <span className="text-purple-400">at</span> AssetController.delete
              (
              <span className="text-zinc-500">
                /src/controllers/asset.ts:142:12
              </span>
              ){"\n"}
              <span className="text-purple-400">at</span> async
              BatchProcessor.run (
              <span className="text-zinc-500">/src/core/batch.ts:89:5</span>)
              {"\n"}
              <span className="text-purple-400">at</span> Object.request (
              <span className="text-zinc-500">
                /node_modules/axios/lib/core.js:45
              </span>
              ){"\n"}
              <span className="text-red-400">
                Error: Network timeout occurred while syncing artifact state.
              </span>
            </pre>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-800 bg-zinc-900/50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
          >
            Close
          </button>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500">
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOM TOAST COMPONENT ---
const NexusToast = ({
  type,
  title,
  message,
  onAction,
  actionLabel,
}: {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onAction: () => void;
  actionLabel: string;
}) => {
  const styles = {
    success: {
      container: "border-emerald-900/50 bg-emerald-950/90",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      title: "text-emerald-100",
      desc: "text-emerald-400/80",
      icon: CheckCircle2,
    },
    error: {
      container: "border-red-900/50 bg-red-950/90",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      title: "text-red-100",
      desc: "text-red-400/80",
      icon: XCircle,
    },
    warning: {
      container: "border-amber-900/50 bg-amber-950/90",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      title: "text-amber-100",
      desc: "text-amber-400/80",
      icon: AlertTriangle,
    },
    info: {
      container: "border-blue-900/50 bg-blue-950/90",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      title: "text-blue-100",
      desc: "text-blue-400/80",
      icon: Info,
    },
  };
  const style = styles[type] || styles.info;
  const Icon = style.icon;

  return (
    <div
      className={`flex w-full items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${style.container}`}
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.iconBg} ${style.iconColor}`}
      >
        <Icon size={14} strokeWidth={3} />
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className={`text-sm font-bold ${style.title}`}>{title}</h4>
        <p className={`mt-1 text-xs leading-relaxed ${style.desc}`}>
          {message}
        </p>
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className={`mt-3 flex items-center gap-2 rounded px-2 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors ${type === "error" ? "bg-red-900/30 text-red-300 hover:bg-red-900/50" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {type === "error" && <Terminal size={10} />}{" "}
            {actionLabel || "View Details"}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Reusable UI Elements ---
const Badge = ({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color: "gray" | "orange" | "blue" | "purple" | "green";
}) => {
  const colors = {
    gray: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    orange: "bg-orange-950/50 text-orange-400 border border-orange-900/50",
    blue: "bg-blue-950/50 text-blue-400 border border-blue-900/50",
    purple: "bg-purple-950/50 text-purple-400 border border-purple-900/50",
    green: "bg-emerald-950/50 text-emerald-400 border border-emerald-900/50",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${colors[color]} tracking-wider uppercase`}
    >
      {children}
    </span>
  );
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg transition-all duration-300 hover:border-zinc-600 hover:shadow-xl ${className}`}
  >
    {children}
  </div>
);

// --- Action Toolbar ---
const ActionToolbar = ({ onTriggerError }: { onTriggerError: () => void }) => {
  const handleExport = () => {
    toast.custom(() => (
      <NexusToast
        type="info"
        title="Export Started"
        message="Compressing asset files..."
        onAction={() => {}}
        actionLabel="View Details"
      />
    ));
    setTimeout(() => {
      toast.custom(() => (
        <NexusToast
          type="success"
          title="Export Complete"
          message="Project_v2.zip has been downloaded."
          onAction={() => {}}
          actionLabel="View Details"
        />
      ));
    }, 1500);
  };
  const handleDuplicate = () =>
    toast.custom(() => (
      <NexusToast
        type="warning"
        title="Duplicate Conflict"
        message="Copy created: 'Sakura Blooms (1)'."
        onAction={() => {}}
        actionLabel="View Details"
      />
    ));
  const handleDelete = () =>
    toast.custom(
      (t) => (
        <NexusToast
          type="error"
          title="Deletion Failed"
          message="Asset is currently referenced by an active Session."
          actionLabel="View Logs"
          onAction={() => {
            toast.dismiss(t);
            onTriggerError();
          }}
        />
      ),
      { duration: 8000 },
    );

  return (
    <div className="absolute top-2 right-2 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 opacity-100 backdrop-blur-md transition-all duration-300 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
      <button
        onClick={handleExport}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Download size={14} />
      </button>
      <button
        onClick={handleDuplicate}
        className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Copy size={14} />
      </button>
      <div className="mx-0.5 h-4 w-px bg-white/10"></div>
      <button
        onClick={handleDelete}
        className="rounded p-1.5 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

// --- Cards ---
const SessionCard = ({
  title,
  lastActive,
  onErrorAction,
}: {
  title: string;
  lastActive: string;
  onErrorAction: () => void;
}) => (
  <Card className="min-h-[320px] border-zinc-700 bg-zinc-900 ring-1 ring-zinc-800 hover:ring-zinc-600">
    <div className="relative h-48 overflow-hidden bg-zinc-800">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-60 transition-transform duration-700 group-hover:scale-105"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
      <div className="absolute top-3 left-3 z-10">
        <Badge color="green">Active</Badge>
      </div>
      <ActionToolbar onTriggerError={onErrorAction} />
      <div className="absolute bottom-0 left-0 w-full p-5">
        <div className="mb-2 flex items-center gap-2">
          <div className="rounded bg-indigo-500/20 p-1.5 text-indigo-400 backdrop-blur-md">
            <Play size={16} />
          </div>
          <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
            Session
          </span>
        </div>
        <h2 className="mb-1 line-clamp-2 text-2xl leading-tight font-bold text-white">
          {title}
        </h2>
      </div>
    </div>
    <div className="flex flex-grow flex-col justify-between p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-sm text-zinc-400">
          <span>Last played</span>
          <span className="text-zinc-300">{lastActive}</span>
        </div>
        <div className="flex -space-x-2 pt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-700 text-xs text-zinc-500">
            A
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-600 text-xs text-zinc-400">
            B
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-500">
            +2
          </div>
        </div>
      </div>
    </div>
  </Card>
);

const CharacterCard = ({
  name,
  summary,
  tags,
  stats,
  onErrorAction,
}: {
  name: string;
  summary: string;
  tags: string[];
  stats: { tokens: number; updated: string };
  onErrorAction: () => void;
}) => (
  <Card>
    <div className="relative h-64 overflow-hidden bg-zinc-800">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"></div>
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          <User size={12} className="text-orange-400" /> CHARACTER
        </div>
      </div>
      <ActionToolbar onTriggerError={onErrorAction} />
    </div>
    <div className="relative z-10 -mt-12 flex flex-grow flex-col p-4">
      <h3 className="mb-1 truncate text-xl font-bold text-white drop-shadow-md">
        {name}
      </h3>
      <div className="mb-4 flex gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mb-4 line-clamp-3 min-h-[3rem] text-xs leading-relaxed text-zinc-400">
        {summary}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <Hash size={12} /> {stats.tokens}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} /> {stats.updated}
        </div>
      </div>
    </div>
  </Card>
);

const ScenarioCard = ({
  title,
  summary,
  tags,
  stats,
  onErrorAction,
}: {
  title: string;
  summary: string;
  tags: string[];
  stats: { starters: number; tokens: number };
  onErrorAction: () => void;
}) => (
  <Card>
    <div className="relative h-40 overflow-hidden bg-zinc-800">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3540&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10"></div>
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          <Scroll size={12} className="text-purple-400" /> SCENARIO
        </div>
      </div>
      <ActionToolbar onTriggerError={onErrorAction} />
    </div>
    <div className="flex flex-grow flex-col p-4">
      <h3 className="mb-2 truncate text-lg font-bold text-zinc-100">{title}</h3>
      <p className="mb-4 line-clamp-3 min-h-[3rem] flex-grow text-xs leading-relaxed text-zinc-400">
        {summary}
      </p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1 text-purple-400/80">
          <MessageSquare size={12} /> {stats.starters} Starters
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Hash size={12} /> {stats.tokens}
        </div>
      </div>
    </div>
  </Card>
);

const WorkflowCard = ({
  title,
  summary,
  version,
  stats,
  onErrorAction,
}: {
  title: string;
  summary: string;
  version: string;
  stats: { nodes: number };
  onErrorAction: () => void;
}) => (
  <Card className="bg-zinc-900">
    <div className="relative h-32 overflow-hidden border-b border-zinc-800 bg-zinc-950">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      ></div>
      <div className="absolute top-8 left-8 h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
      <div className="absolute top-16 left-24 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <path
          d="M44 44 Q 70 44 80 70"
          stroke="rgba(99,102,241,0.3)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">
          <Dices size={12} className="text-blue-400" /> WORKFLOW
        </div>
      </div>
      <ActionToolbar onTriggerError={onErrorAction} />
    </div>
    <div className="flex flex-grow flex-col p-4">
      <div className="mb-1 flex items-start justify-between">
        <h3 className="truncate pr-2 text-lg font-bold text-zinc-100">
          {title}
        </h3>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
          v{version}
        </span>
      </div>
      <p className="mb-4 line-clamp-3 min-h-[3rem] flex-grow font-mono text-xs leading-relaxed text-zinc-400">
        {summary}
      </p>
      <div className="mt-auto flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/50 p-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <GitBranch size={12} /> <span>{stats.nodes} Nodes</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-green-500"></span> Valid
        </div>
      </div>
    </div>
  </Card>
);

// --- Sidebar Item (Collapsible) ---
const NavItem = ({
  icon,
  label,
  active = false,
  badge,
  isCollapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  isCollapsed?: boolean;
}) => (
  <button
    className={`group relative flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${isCollapsed ? "w-full justify-center" : "w-full justify-between"} ${active ? "border-zinc-700 bg-zinc-800 text-white shadow-sm" : "border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}
  >
    <div
      className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
    >
      {icon}
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

const CreateMenuItem = ({
  icon: Icon,
  label,
  colorClass,
}: {
  icon: any;
  label: string;
  colorClass?: string;
}) => (
  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white">
    <Icon size={16} className={colorClass} />
    <span>{label}</span>
  </button>
);

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
        {/* Header */}
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

        {/* Create Button */}
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

        {/* Navigation */}
        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto px-2 py-2">
          <div className="mb-6 space-y-1">
            <div
              className={`mb-2 px-2 text-[10px] font-bold tracking-widest whitespace-nowrap text-zinc-600 uppercase transition-all duration-300 ${isCollapsed ? "h-0 overflow-hidden text-center opacity-0" : "opacity-100"}`}
            >
              Play
            </div>
            <NavItem
              icon={<Play size={16} />}
              label="Play"
              active
              badge="4"
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
              icon={<User size={16} />}
              label="Characters"
              badge="12"
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<Scroll size={16} />}
              label="Scenarios"
              badge="5"
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<Dices size={16} />}
              label="Workflows"
              badge="8"
              isCollapsed={isCollapsed}
            />
          </div>
          <div className="mt-auto">
            <NavItem
              icon={<Settings size={16} />}
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

export default function ProjectDashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [errorDialogData, setErrorDialogData] = useState<{
    message: string;
    code: string;
  } | null>(null);
  const triggerErrorDialog = () =>
    setErrorDialogData({
      message: "Deletion Failed: Resource Locked",
      code: "ERR_REF_LOCK_02",
    });

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans text-zinc-200">
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          className: "bg-transparent border-none shadow-none p-0",
        }}
      />
      <ErrorDetailDialog
        isOpen={!!errorDialogData}
        onClose={() => setErrorDialogData(null)}
        errorData={errorDialogData || {}}
      />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
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
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <div className="mb-10 flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                <span>Home</span>
                <ChevronRight size={12} />
                <span>Library</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Project Library</h1>
              <p className="mt-1 text-zinc-500">
                Manage your active sessions and reusable narrative assets.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700">
                Recently Updated
              </button>
              <button className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-800">
                A-Z
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pl-1">
                <div className="text-xs font-bold tracking-widest text-indigo-400 uppercase opacity-80">
                  Active Session
                </div>
                <MoreHorizontal
                  size={14}
                  className="cursor-pointer text-zinc-600 hover:text-white"
                />
              </div>
              <SessionCard
                title="Sakura Blooms, Hearts Awaken"
                lastActive="2h ago"
                onErrorAction={triggerErrorDialog}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pl-1">
                <div className="text-xs font-bold tracking-widest text-orange-400 uppercase opacity-80">
                  Character Asset
                </div>
                <MoreHorizontal
                  size={14}
                  className="cursor-pointer text-zinc-600 hover:text-white"
                />
              </div>
              <CharacterCard
                name="Sakuraba Yui"
                summary="A gentle classmate who secretly loves gardening and heavy metal music. She struggles to express her true feelings."
                tags={["#shy", "#student"]}
                stats={{ tokens: 573, updated: "2d" }}
                onErrorAction={triggerErrorDialog}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pl-1">
                <div className="text-xs font-bold tracking-widest text-purple-400 uppercase opacity-80">
                  Scenario Asset
                </div>
                <MoreHorizontal
                  size={14}
                  className="cursor-pointer text-zinc-600 hover:text-white"
                />
              </div>
              <ScenarioCard
                title="Sakura Blooms"
                summary="A romantic scenario set during the spring festival. The cherry blossoms are falling, creating a perfect atmosphere for confession."
                tags={["#romance", "#slice-of-life"]}
                stats={{ tokens: 1200, starters: 2 }}
                onErrorAction={triggerErrorDialog}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pl-1">
                <div className="text-xs font-bold tracking-widest text-blue-400 uppercase opacity-80">
                  Workflow Asset
                </div>
                <MoreHorizontal
                  size={14}
                  className="cursor-pointer text-zinc-600 hover:text-white"
                />
              </div>
              <WorkflowCard
                title="Dice of Fate"
                version="2.1"
                summary="Randomizes outcome of skill checks during dialogue based on d20 ruleset."
                stats={{ nodes: 14 }}
                onErrorAction={triggerErrorDialog}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
