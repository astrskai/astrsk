import React from "react";
import {
  MessageSquare,
  User,
  Scroll,
  Dices,
  MoreHorizontal,
  Clock,
  Hash,
  FileText,
  Play,
  Layers,
  GitBranch,
  Image as ImageIcon,
} from "lucide-react";
// --- Reusable UI Elements ---
const Badge = ({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "orange" | "blue" | "purple" | "green";
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
    className={`group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg transition-all duration-300 hover:border-zinc-600 hover:shadow-xl ${className}`}
  >
    {children}
  </div>
);
// --- 1. The Session Card ---
// Remains the "Instance" where things happen
const SessionCard = ({
  title,
  lastActive,
}: {
  title: string;
  lastActive: string;
}) => {
  return (
    <Card className="h-full min-h-[320px] w-full border-zinc-700 bg-zinc-900 ring-1 ring-zinc-800 hover:ring-zinc-600">
      {/* Header Image Area */}
      <div className="relative h-48 overflow-hidden bg-zinc-800">
        {/* Placeholder Abstract Art for Session */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-60 transition-transform duration-700 group-hover:scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>

        {/* <div className="absolute top-3 right-3">
          <Badge color="green">Active</Badge>
        </div> */}
        <div className="absolute bottom-0 left-0 w-full p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded bg-indigo-500/20 p-1.5 text-indigo-400 backdrop-blur-md">
              <Layers size={16} />
            </div>
            <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
              Session
            </span>
          </div>
          <h2 className="mb-1 text-2xl leading-tight font-bold text-white">
            {title}
          </h2>
        </div>
      </div>
      {/* Session Details */}
      <div className="flex flex-grow flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-sm text-zinc-400">
            <span>Last played</span>
            <span className="text-zinc-300">{lastActive}</span>
          </div>
          <div className="flex -space-x-2 pt-1">
            {/* Simulated User Avatars */}
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
};
// --- 2. Character Card ---
// Focus: Portrait Image
const CharacterCard = ({
  name,
  summary,
  tags,
  stats,
}: {
  name: string;
  summary: string;
  tags: string[];
  stats: { tokens: number; updated: string };
}) => {
  return (
    <Card className="h-full">
      {/* Image Area - Portrait ratio focused */}
      <div className="relative h-64 overflow-hidden bg-zinc-800">
        {/* Placeholder Character Image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"></div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <User size={12} className="text-orange-400" />
            CHARACTER
          </div>
        </div>
      </div>
      <div className="relative z-10 -mt-12 flex flex-grow flex-col p-4">
        <h3 className="mb-1 text-xl font-bold text-white drop-shadow-md">
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

        <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-zinc-400">
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
};
// --- 3. Scenario Card ---
// Focus: Landscape/Atmosphere Image
const ScenarioCard = ({
  title,
  summary,
  tags,
  stats,
}: {
  title: string;
  summary: string;
  tags: string[];
  stats: { tokens: number; starters: number };
}) => {
  return (
    <Card className="h-full">
      {/* Image Area - Landscape ratio */}
      <div className="relative h-40 overflow-hidden bg-zinc-800">
        {/* Placeholder Scenario Image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3540&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10"></div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Scroll size={12} className="text-purple-400" />
            SCENARIO
          </div>
        </div>
      </div>
      <div className="flex flex-grow flex-col p-4">
        <h3 className="mb-2 text-lg font-bold text-zinc-100">{title}</h3>

        <p className="mb-4 flex-grow text-xs leading-relaxed text-zinc-400">
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
};
// --- 4. Workflow Card ---
// Focus: Technical/Schematic (No Image, Pattern instead)
const WorkflowCard = ({
  title,
  summary,
  version,
  stats,
}: {
  title: string;
  summary: string;
  version: string;
  stats: { nodes: number };
}) => {
  return (
    <Card className="h-full bg-zinc-900">
      {/* Pattern Header - No User Image */}
      <div className="relative h-32 overflow-hidden border-b border-zinc-800 bg-zinc-950">
        {/* CSS Pattern for Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        ></div>

        {/* Abstract Nodes */}
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
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">
            <Dices size={12} className="text-blue-400" />
            WORKFLOW
          </div>
        </div>
      </div>
      <div className="flex flex-grow flex-col p-4">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            v{version}
          </span>
        </div>

        <p className="mb-4 flex-grow font-mono text-xs leading-relaxed text-zinc-400">
          {summary}
        </p>
        <div className="mt-auto flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/50 p-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <GitBranch size={12} />
            <span>{stats.nodes} Nodes</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Valid
          </div>
        </div>
      </div>
    </Card>
  );
};
export default function CardV2() {
  return (
    <div className="min-h-screen bg-black p-8 font-sans text-zinc-200">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Project Library
          </h1>
          <p className="text-zinc-500">
            Manage your sessions and reusable assets.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: The Session (Instance) */}
          <div className="flex flex-col gap-2">
            <div className="mb-1 pl-1 text-xs font-bold tracking-widest text-zinc-600 uppercase">
              Current Session
            </div>
            <SessionCard
              title="Sakura Blooms, Hearts Awaken"
              lastActive="2h ago"
            />
          </div>
          {/* Column 2: Character Asset */}
          <div className="flex flex-col gap-2">
            <div className="mb-1 pl-1 text-xs font-bold tracking-widest text-zinc-600 uppercase">
              Character Asset
            </div>
            <CharacterCard
              name="Sakuraba Yui"
              summary="A gentle classmate who secretly loves gardening and heavy metal music. She struggles to express her true feelings."
              tags={["#shy", "#student"]}
              stats={{ tokens: 573, updated: "2d" }}
            />
          </div>
          {/* Column 3: Scenario Asset */}
          <div className="flex flex-col gap-2">
            <div className="mb-1 pl-1 text-xs font-bold tracking-widest text-zinc-600 uppercase">
              Scenario Asset
            </div>
            <ScenarioCard
              title="Sakura Blooms"
              summary="A romantic scenario set during the spring festival. The cherry blossoms are falling, creating a perfect atmosphere for confession."
              tags={["#romance", "#slice-of-life"]}
              stats={{ tokens: 1200, starters: 2 }}
            />
          </div>
          {/* Column 4: Workflow Asset */}
          <div className="flex flex-col gap-2">
            <div className="mb-1 pl-1 text-xs font-bold tracking-widest text-zinc-600 uppercase">
              Workflow Asset
            </div>
            <WorkflowCard
              title="Dice of Fate"
              version="2.1"
              summary="Randomizes outcome of skill checks during dialogue based on d20 ruleset."
              stats={{ nodes: 14 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
