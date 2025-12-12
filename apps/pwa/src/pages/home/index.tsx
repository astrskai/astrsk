import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowRight,
  Plus,
  Sparkles,
  Box,
  Terminal,
  Search,
  Ghost,
  Heart,
  Coffee,
  Book,
  ShieldCheck,
  Zap,
  CloudRain,
  Anchor,
  Crown,
  Mountain,
  Skull,
} from "lucide-react";
import { useSessionsWithCharacterMetadata } from "@/entities/session/api";
import { characterQueries } from "@/entities/character/api";
import { CharacterCard as CharacterCardDomain } from "@/entities/card/domain";
import { Session } from "@/entities/session/domain";
import SessionCard from "@/features/session/ui/session-card";
import CharacterCard from "@/features/character/ui/character-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { Button } from "@/shared/ui/button";

// Genre suggestions for quick scenario creation
const GENRE_SUGGESTIONS = [
  { label: "Fantasy", icon: <Sparkles size={12} /> },
  { label: "SciFi", icon: <Box size={12} /> },
  { label: "Cyberpunk", icon: <Terminal size={12} /> },
  { label: "Mystery", icon: <Search size={12} /> },
  { label: "Horror", icon: <Ghost size={12} /> },
  { label: "Romance", icon: <Heart size={12} /> },
  { label: "SliceOfLife", icon: <Coffee size={12} /> },
  { label: "Historical", icon: <Book size={12} /> },
  { label: "Survival", icon: <ShieldCheck size={12} /> },
  { label: "Steampunk", icon: <Zap size={12} /> },
  { label: "Dystopian", icon: <CloudRain size={12} /> },
  { label: "Pirates", icon: <Anchor size={12} /> },
  { label: "Kingdom", icon: <Crown size={12} /> },
  { label: "Western", icon: <Mountain size={12} /> },
  { label: "Zombies", icon: <Skull size={12} /> },
];

/**
 * Session Card Wrapper
 * Wraps SessionCard with data fetching logic
 */
interface SessionCardWrapperProps {
  session: Session;
  characterAvatars: Array<{ name: string; iconAssetId?: string }>;
  areCharactersLoading?: boolean;
}

function SessionCardWrapper({ session, characterAvatars, areCharactersLoading }: SessionCardWrapperProps) {
  const navigate = useNavigate();
  const sessionId = session?.id?.toString() || "";
  const coverId = session?.props?.coverId;

  // Call hooks unconditionally (before any early returns)
  const [coverImageUrl] = useAsset(coverId);

  // Safety check - ensure session and props exist
  if (!session || !session.props) {
    return null;
  }

  const messageCount = session.props.turnIds?.length || 0;

  const handleSessionClick = () => {
    navigate({
      to: "/sessions/settings/$sessionId",
      params: { sessionId },
    });
  };

  return (
    <SessionCard
      title={session.props.title || "Untitled Session"}
      imageUrl={coverImageUrl}
      messageCount={messageCount}
      onClick={handleSessionClick}
      characterAvatars={characterAvatars}
      areCharactersLoading={areCharactersLoading}
    />
  );
}

/**
 * Character Card Wrapper
 * Wraps CharacterCard with data fetching logic
 */
interface CharacterCardWrapperProps {
  character: CharacterCardDomain;
}

function CharacterCardWrapper({ character }: CharacterCardWrapperProps) {
  const navigate = useNavigate();
  const cardId = character?.id?.toString() || "";

  // Call hooks unconditionally (before any early returns)
  const [imageUrl] = useAsset(character?.props?.iconAssetId);

  // Safety check
  if (!character || !character.props) {
    return null;
  }

  const handleCharacterClick = () => {
    navigate({
      to: "/assets/characters/{-$characterId}",
      params: { characterId: cardId },
    });
  };

  return (
    <CharacterCard
      imageUrl={imageUrl}
      name={character.props.name || "Untitled Character"}
      summary={character.props.cardSummary}
      tags={character.props.tags || []}
      tokenCount={character.props.tokenCount}
      onClick={handleCharacterClick}
    />
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  // Fetch top 3 recent sessions with character metadata
  const { sessions: allSessionsWithMeta, areCharactersLoading } = useSessionsWithCharacterMetadata({
    keyword: "",
    sort: "updatedAt",
    isPlaySession: false,
  });
  const sessionsWithMeta = allSessionsWithMeta.slice(0, 3);

  // Fetch top 3 recent characters
  // Note: characterQueries.list already returns CharacterCard[] domain objects
  const { data: allCharacters = [] } = useQuery(
    characterQueries.list({ keyword: "", sort: "updatedAt" })
  );
  const characters = allCharacters.slice(0, 3);

  const handleAddTag = (label: string) => {
    setPrompt((prev) => {
      const tagText = ` #${label}`;
      return prev ? prev + tagText : tagText.trim();
    });
  };

  const handleCreateRoleplay = () => {
    // Navigate to session creation with the prompt as initial scenario data
    // The session creation page will use this to pre-fill and auto-start generation
    navigate({
      to: "/sessions/new",
      // @ts-expect-error - TanStack Router state typing
      state: { initialPrompt: prompt.trim() }
    });
  };

  return (
    <div className="relative flex min-h-full flex-col items-center overflow-y-auto bg-black font-sans text-gray-100 selection:bg-blue-500/30">
      {/* Animated Background Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] animate-blob rounded-full bg-purple-600/30 mix-blend-screen blur-[100px] filter"></div>
        <div className="animation-delay-2000 absolute right-[-20%] top-[-10%] h-[400px] w-[400px] animate-blob rounded-full bg-blue-600/30 mix-blend-screen blur-[100px] filter"></div>
        <div className="animation-delay-4000 absolute bottom-[-20%] left-[20%] h-[600px] w-[600px] animate-blob rounded-full bg-pink-600/20 mix-blend-screen blur-[120px] filter"></div>
        <div className="animation-delay-2000 absolute bottom-[10%] right-[10%] h-[300px] w-[300px] animate-blob rounded-full bg-cyan-600/20 mix-blend-screen blur-[80px] filter"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>


      {/* Main Content Area */}
      <main className="relative z-10 flex w-full flex-1 flex-col">
        {/* Centered Hero Section */}
        <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 text-center">
          <div className="flex flex-col items-center">
            {/* Headline */}
            <h1 className="mb-16 text-5xl font-bold leading-[1.1] tracking-tight drop-shadow-2xl md:text-7xl">
              Dream It. Play It.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Infinite Stories Await.
              </span>
            </h1>

            {/* Large Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="group mb-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0A0A]/80 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-colors duration-300 focus-within:border-blue-500/50"
            >
              <div className="relative flex h-auto flex-col">
                <textarea
                  className="h-32 w-full resize-none bg-transparent px-4 py-4 text-lg font-normal text-white placeholder-gray-500 outline-none md:text-xl"
                  placeholder="Describe a scenario to create and play..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="mt-2 flex items-center justify-between px-4 pb-2">
                  <div className="flex gap-2">{/* Optional tool icons */}</div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleCreateRoleplay} variant="accent" size="lg">
                      Create Roleplay
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Genre Tags */}
            <div className="flex w-full flex-col items-center gap-4">
              <span className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium uppercase tracking-widest text-gray-400 backdrop-blur-sm">
                <Plus size={10} /> Click to add genre
              </span>

              <div className="flex max-w-3xl flex-wrap justify-center gap-2">
                {GENRE_SUGGESTIONS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddTag(item.label)}
                    className="group flex items-center gap-1.5 rounded-full border border-white/5 bg-[#161616]/60 px-3 py-1.5 text-xs font-medium text-gray-400 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-blue-500/30 hover:bg-[#202020]/80 hover:text-blue-300 active:scale-95"
                  >
                    <Plus size={12} className="text-gray-600 transition-colors group-hover:text-blue-400" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions Section */}
        {sessionsWithMeta.length > 0 && (
          <div className="w-full max-w-6xl self-center border-t border-white/10 px-6 pb-10 pt-10 text-left">
            <div className="mb-6 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Recent Sessions
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {sessionsWithMeta.map(({ session, characterAvatars }) => (
                <SessionCardWrapper
                  key={session.id.toString()}
                  session={session}
                  characterAvatars={characterAvatars}
                  areCharactersLoading={areCharactersLoading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Characters Section */}
        {characters.length > 0 && (
          <div className="w-full max-w-6xl self-center border-t border-white/10 px-6 pb-20 pt-10 text-left">
            <div className="mb-6 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Recent Characters
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {characters.map((character) => (
                <CharacterCardWrapper key={character.id.toString()} character={character} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Animation Styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
