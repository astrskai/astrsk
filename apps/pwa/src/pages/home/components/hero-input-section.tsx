import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { GENRE_SUGGESTIONS } from "@/entities/card/domain";
import { useTypewriterPlaceholder } from "@/shared/hooks/use-typewriter-placeholder";
import { Button } from "@/shared/ui/button";

/**
 * Hero input section with typewriter animation
 * Isolated component to prevent typewriter animation from re-rendering parent
 */
export function HeroInputSection() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  // Generate genre hashtag combinations for typewriter animation
  const genreVariations = useMemo(() => {
    // Create stable combinations from GENRE_SUGGESTIONS
    const combinations: string[] = [];
    for (let i = 0; i < Math.min(5, GENRE_SUGGESTIONS.length - 1); i++) {
      const first = GENRE_SUGGESTIONS[i];
      const second = GENRE_SUGGESTIONS[i + 1];
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

  const handleAddTag = (label: string) => {
    setPrompt((prev) => {
      const tagText = ` #${label}`;
      return prev ? prev + tagText : tagText.trim();
    });
  };

  const handleCreateRoleplay = () => {
    // Navigate to session creation with the prompt as initial scenario data
    navigate({
      to: "/sessions/new",
      // @ts-expect-error - TanStack Router state typing
      state: { initialPrompt: prompt.trim() }
    });
  };

  return (
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
  );
}
