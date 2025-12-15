import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { CharacterCard } from "@astrsk/design-system";
import { useSessionsWithCharacterMetadata } from "@/entities/session/api";
import { characterQueries } from "@/entities/character/api";
import { CharacterCard as CharacterCardDomain, GENRE_SUGGESTIONS } from "@/entities/card/domain";
import { Session } from "@/entities/session/domain";
import SessionCard from "@/features/session/ui/session-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { useTypewriterPlaceholder } from "@/shared/hooks/use-typewriter-placeholder";
import { Button } from "@/shared/ui/button";

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
      title={session.props.name || "Untitled Session"}
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

  // Generate random genre hashtag combinations for typewriter animation (shuffle and create pairs)
  const genreVariations = useMemo(() => {
    const shuffled = [...GENRE_SUGGESTIONS].sort(() => Math.random() - 0.5);
    // Create combinations of two hashtags with "..." after them
    const combinations: string[] = [];
    for (let i = 0; i < Math.min(5, shuffled.length - 1); i++) {
      const first = shuffled[i];
      const second = shuffled[i + 1];
      combinations.push(`#${first} #${second} ...`);
    }
    return combinations;
  }, []);

  // Typewriter placeholder animation
  const typewriterPlaceholder = useTypewriterPlaceholder({
    baseText: "Describe a scenario to play in ",
    variations: genreVariations,
    typingSpeed: 80,
    erasingSpeed: 40,
    pauseAfterTyping: 2000,
    pauseAfterErasing: 300,
  });

  // Fetch recent sessions with character metadata
  // Mobile: 2 items, Desktop: 3 items
  const { sessions: allSessionsWithMeta, areCharactersLoading } = useSessionsWithCharacterMetadata({
    keyword: "",
    sort: "updatedAt",
    isPlaySession: false,
  });

  // Fetch recent characters
  // Note: characterQueries.list already returns CharacterCard[] domain objects
  const { data: allCharacters = [] } = useQuery(
    characterQueries.list({ keyword: "", sort: "updatedAt" })
  );

  // Responsive slicing: 2 items on mobile, 3 items on desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sessionLimit = isMobile ? 2 : 3;
  const characterLimit = isMobile ? 2 : 4;
  const sessionsWithMeta = allSessionsWithMeta.slice(0, sessionLimit);
  const characters = allCharacters.slice(0, characterLimit);

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
        <div className="flex pt-20 min-h-[75vh] w-full flex-col items-center justify-center px-6 text-center">
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
            <div className="group mb-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0A0A0A]/80 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-colors duration-300 focus-within:border-blue-500/50">
              <div className="relative flex h-auto flex-col">
                <textarea
                  className="h-32 w-full resize-none bg-transparent px-4 py-4 text-lg font-normal text-white placeholder-gray-500 outline-none md:text-xl"
                  placeholder={typewriterPlaceholder}
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
            </div>

            {/* Genre Tags */}
            <div className="flex w-full flex-col items-center gap-4">
              <span className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-medium uppercase tracking-widest text-gray-400 backdrop-blur-sm">
                <Plus size={10} /> Click to add genre
              </span>

              <div className="flex max-w-3xl flex-wrap justify-center gap-2">
                {GENRE_SUGGESTIONS.map((genre, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddTag(genre)}
                    className="group flex items-center gap-1.5 rounded-full border border-white/5 bg-[#161616]/60 px-2 py-1.5 text-xs font-medium text-gray-400 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-blue-500/30 hover:bg-[#202020]/80 hover:text-blue-300 active:scale-95"
                  >
                    <Plus size={12} className="text-gray-600 transition-colors group-hover:text-blue-400" />
                    <span>{genre}</span>
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
                Or Play Sessions
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
                Or start session with a Character
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
