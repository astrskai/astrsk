import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  User,
  Scroll,
  Dices,
  Sparkles,
  ArrowRight,
  Play,
  Zap,
  ChevronRight,
  Lock,
  ShieldCheck,
  Database,
  HardDrive,
} from "lucide-react";

// --- Components ---

// 1. Navbar
const Navbar = () => (
  <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <Sparkles size={16} fill="currentColor" />
        </div>
        <span className="text-lg font-bold tracking-wide text-zinc-100">
          NEXUS<span className="text-zinc-600">.AI</span>
        </span>
      </div>
      <div className="hidden items-center gap-8 md:flex">
        <a
          href="#features"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Features
        </a>
        <a
          href="#showcase"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Showcase
        </a>
        <a
          href="#privacy"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Privacy
        </a>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-zinc-400 hover:text-white">
          Log in
        </button>
        <button className="group flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105">
          Get Started
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </div>
  </nav>
);

// 2. Simulated Chat Component (The Hook)
const TypewriterText = ({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

const ChatDemo = () => {
  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-indigo-500/10">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/20"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500/20"></div>
          <div className="h-3 w-3 rounded-full bg-green-500/20"></div>
        </div>
        <div className="mx-auto flex items-center gap-2 text-xs font-medium text-zinc-500">
          <HardDrive size={10} className="text-emerald-500" />
          <span>Local Session: The Clockwork Spire</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex min-h-[300px] flex-col gap-4 p-6">
        {/* AI Message */}
        <div className="flex gap-4">
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-purple-500/30">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop"
              alt="AI"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-orange-400">
                Sakuraba Yui
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                NPC
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-zinc-300">
              <TypewriterText text="She hesitates, looking around nervously. 'Are you sure no one is listening? What we're about to discuss... it can't leave this room.'" />
            </p>
          </div>
        </div>

        {/* User Message */}
        <div className="flex flex-row-reverse gap-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-500">
            You
          </div>
          <div className="space-y-1 text-right">
            <div className="text-sm font-bold text-indigo-400">Player</div>
            <div className="inline-block rounded-2xl rounded-tr-sm bg-indigo-600/20 px-4 py-2 text-left text-sm text-indigo-100">
              "Don't worry, Yui. This data stays on my device. We're completely
              off the grid."
            </div>
          </div>
        </div>

        {/* AI Response (Simulated loading) */}
        <div className="flex gap-4 opacity-80">
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-purple-500/30">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop"
              alt="AI"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-orange-400">
                Sakuraba Yui
              </span>
            </div>
            <div className="flex gap-1">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Mock */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-500">
          <span className="text-sm">What do you do next?</span>
          <div className="ml-auto h-4 w-0.5 animate-pulse bg-indigo-500"></div>
        </div>
      </div>
    </div>
  );
};

// 3. Feature Card
const FeatureHighlight = ({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "orange" | "purple" | "blue" | "emerald";
}) => {
  const colors = {
    orange:
      "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:border-orange-500/50",
    purple:
      "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:border-purple-500/50",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:border-blue-500/50",
    emerald:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:border-emerald-500/50",
  };
  return (
    <div
      className={`group cursor-pointer rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 ${colors[color as keyof typeof colors]}`}
    >
      <div className="mb-4 inline-flex rounded-lg bg-black/40 p-3">{Icon}</div>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
};

// --- Main Layout ---
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black font-sans text-zinc-200 selection:bg-indigo-500/30">
      {/* <Navbar /> */}

      {/* --- HERO SECTION --- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-28 pb-16">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

        {/* Content */}
        <div className="z-10 container mx-auto px-4 text-center">
          {/* Privacy Badge - Highly Visible */}
          <div className="mb-8 flex justify-center">
            <div className="animate-fade-in-up flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-sm text-zinc-300 backdrop-blur-xl transition-all hover:border-emerald-500/50 hover:bg-emerald-950/10">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span>
                Your sessions are stored locally —{" "}
                <span className="font-bold text-emerald-400">
                  only on your device
                </span>
              </span>
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Immersive Roleplay. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Uncompromising Privacy.
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-zinc-400 md:text-xl">
            The next-generation AI storytelling platform that runs entirely in
            your browser. Design complex characters and worlds without your data
            ever leaving your machine.
          </p>

          <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="flex h-12 items-center gap-2 rounded-lg bg-white px-8 text-base font-bold text-black transition-transform hover:scale-105 hover:bg-zinc-200">
              Start Creating Session
            </button>
            <button className="flex h-12 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 hover:text-white">
              <Play size={16} /> Watch Tutorial
            </button>
          </div>

          {/* The Chat Hook */}
          <div className="perspective-1000 w-full">
            <div className="transform transition-transform duration-500 hover:scale-[1.01]">
              <ChatDemo />
            </div>
          </div>
        </div>

        {/* Gradient Fade at bottom of Hero */}
        <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* --- ASSET PILLARS SECTION --- */}
      <section id="features" className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Architect Your Narrative
            </h2>
            <p className="text-zinc-500">
              Powerful tools for storytellers, secured by local storage.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <FeatureHighlight
              icon={<ShieldCheck size={24} />}
              color="emerald"
              title="100% Private"
              desc="No servers. No cloud sync. Your stories live on your hard drive and nowhere else."
            />
            <FeatureHighlight
              icon={<User size={24} />}
              color="orange"
              title="Deep Characters"
              desc="Define personality traits, hidden secrets, and speaking styles. AI remembers every interaction."
            />
            <FeatureHighlight
              icon={<Scroll size={24} />}
              color="purple"
              title="Living Scenarios"
              desc="Set the stage with dynamic worlds that evolve. From cyberpunk cities to ancient forests."
            />
            <FeatureHighlight
              icon={<Dices size={24} />}
              color="blue"
              title="Logic Workflows"
              desc="Take control. Design the RNG mechanics, skill checks, and branching paths visually."
            />
          </div>
        </div>
      </section>

      {/* --- TECHNICAL SHOWCASE (Workflow Visual) --- */}
      <section className="border-y border-zinc-800 bg-zinc-900/30 py-24">
        <div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:flex-row">
          <div className="lg:w-1/2">
            <div className="mb-2 flex items-center gap-2 font-bold text-blue-400">
              <Zap size={16} />
              <span className="text-sm tracking-wider uppercase">
                Powerful Engine
              </span>
            </div>
            <h2 className="mb-6 text-4xl font-bold text-white">
              Visual Logic Builder
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-zinc-400">
              Don't just write text; design the simulation. Our node-based
              Workflow editor allows you to inject D&D-style rules, API calls,
              and memory triggers directly into the chat stream.
            </p>
            <ul className="space-y-4">
              {[
                "Drag-and-drop node interface",
                "Custom variable tracking (HP, Inventory)",
                "External API Webhooks",
                "Multi-agent orchestration",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                    <ChevronRight size={12} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-96 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl lg:w-1/2">
            {/* Abstract visualization of the Workflow UI */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#3b82f6 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
            <div className="absolute top-1/2 left-1/2 h-32 w-48 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-600 bg-zinc-900 p-4 shadow-lg">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-700 pb-2">
                <span className="text-xs font-bold text-zinc-300">
                  Skill Check
                </span>
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 rounded bg-zinc-800"></div>
                <div className="h-2 w-1/2 rounded bg-zinc-800"></div>
              </div>
            </div>
            {/* Connection Lines */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <path
                d="M 100 100 Q 200 150 280 180"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />
              <path
                d="M 450 250 Q 350 200 280 220"
                stroke="#6366f1"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-zinc-900 bg-black py-16 text-zinc-500">
        <div className="container mx-auto flex flex-col items-center gap-8 px-6 text-center md:text-left">
          {/* Logo & Mission */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={20} className="text-indigo-500" />
              <span className="text-xl font-bold">NEXUS.AI</span>
            </div>
            <p className="max-w-md text-center text-sm text-zinc-400">
              Empowering creators to build the next generation of interactive
              stories with complete privacy and control.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px w-full max-w-3xl bg-zinc-900"></div>

          {/* Company Info (Specific) */}
          <div className="flex flex-col items-center gap-6 text-center text-xs text-zinc-600">
            <div className="flex flex-col gap-1 md:flex-row md:gap-4">
              <span>
                <strong>Company Name:</strong> harpy chat(jejoon yoo)
              </span>
              <span className="hidden text-zinc-800 md:inline">|</span>
              <span>
                <strong>Address:</strong> 7, Samseong-ro 58-gil, Gangnam-gu,
                Seoul, Republic of Korea, 06282
              </span>
            </div>
            <div className="flex flex-col gap-1 md:flex-row md:gap-4">
              <span>
                <strong>Contact:</strong> +82-10-7490-1918 or cyoo@astrsk.ai
              </span>
              <span className="hidden text-zinc-800 md:inline">|</span>
              <span>
                <strong>BRN:</strong> 299-88-02625
              </span>
            </div>
          </div>

          <div className="mt-8 text-[10px] text-zinc-800">
            © 2024 NEXUS.AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
