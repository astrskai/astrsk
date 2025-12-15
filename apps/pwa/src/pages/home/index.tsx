import { useState, useEffect, useRef } from "react";
import { fetchFeaturedSessions, fetchFeaturedCharacters, type FeaturedSessionData, type FeaturedCharacterData } from "./api/homepage-queries";
import { FeaturedSessionCard, CloudCharacterCard, HeroInputSection } from "./components";


export function HomePage() {
  const hasFetchedRef = useRef(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768; // md breakpoint
      setIsMobile((prev) => {
        // Only update if the value actually changes
        if (prev !== newIsMobile) {
          return newIsMobile;
        }
        return prev;
      });
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Featured data state
  const [featuredSessions, setFeaturedSessions] = useState<FeaturedSessionData[]>([]);
  const [featuredCharacters, setFeaturedCharacters] = useState<FeaturedCharacterData[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);

  // Fetch featured data on mount only (not on resize)
  useEffect(() => {
    // Guard against multiple fetches (e.g., React Strict Mode double-mounting)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const sessionLimit = isMobile ? 2 : 3;
    const characterLimit = isMobile ? 2 : 4;

    // Fetch sessions
    fetchFeaturedSessions(sessionLimit).then((result) => {
      if (result.isSuccess) {
        setFeaturedSessions(result.getValue());
      } else {
        console.error("[HomePage] Failed to fetch sessions:", result.getError());
      }
      setIsLoadingSessions(false);
    });

    // Fetch characters
    fetchFeaturedCharacters(characterLimit).then((result) => {
      if (result.isSuccess) {
        setFeaturedCharacters(result.getValue());
      } else {
        console.error("[HomePage] Failed to fetch characters:", result.getError());
      }
      setIsLoadingCharacters(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount, ignore isMobile changes

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
        {/* Centered Hero Section - Isolated component to prevent re-renders */}
        <HeroInputSection />

        {/* Featured Sessions Section (from Harpy Chat Hub) */}
        {!isLoadingSessions && featuredSessions.length > 0 && (
          <div className="w-full max-w-6xl self-center border-t border-white/10 px-6 pb-10 pt-10 text-left">
            <div className="mb-6 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Featured Sessions from Harpy Chat Hub
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {featuredSessions.map((session) => (
                <FeaturedSessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {/* Loading State for Sessions */}
        {isLoadingSessions && (
          <div className="w-full max-w-6xl self-center border-t border-white/10 px-6 pb-10 pt-10 text-left">
            <div className="mb-6 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Featured Sessions from Harpy Chat Hub
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="h-64 animate-pulse rounded-lg bg-white/5"></div>
              <div className="h-64 animate-pulse rounded-lg bg-white/5"></div>
              {!isMobile && <div className="h-64 animate-pulse rounded-lg bg-white/5"></div>}
            </div>
          </div>
        )}

        {/* Featured Characters Section (from Harpy Chat Hub) */}
        {!isLoadingCharacters && featuredCharacters.length > 0 && (
          <div className="w-full max-w-6xl self-center border-t border-white/10 px-6 pb-20 pt-10 text-left">
            <div className="mb-6 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Featured Characters from Harpy Chat Hub
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featuredCharacters.map((character) => (
                <CloudCharacterCard key={character.id} character={character} />
              ))}
            </div>
          </div>
        )}

        {/* Loading State for Characters */}
        {isLoadingCharacters && (
          <div className="w-full max-w-6xl self-center border-t border-white/10 px-6 pb-20 pt-10 text-left">
            <div className="mb-6 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Featured Characters from Harpy Chat Hub
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="h-80 animate-pulse rounded-lg bg-white/5"></div>
              <div className="h-80 animate-pulse rounded-lg bg-white/5"></div>
              {!isMobile && (
                <>
                  <div className="h-80 animate-pulse rounded-lg bg-white/5"></div>
                  <div className="h-80 animate-pulse rounded-lg bg-white/5"></div>
                </>
              )}
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
