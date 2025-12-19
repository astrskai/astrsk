import { ChevronsRight } from "lucide-react";
import { IconHarpyLogo, AstrskPwaIcon } from "@/shared/assets/icons";

interface SharedWelcomeProps {
  onEnter: () => void;
}

// Harpy Logo - Scales on desktop
const HarpyLogo = () => (
  <div className="group relative h-14 w-14 cursor-default md:h-24 md:w-24">
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg shadow-orange-600/30 transition-all duration-500 md:rounded-3xl group-hover:rotate-3 group-hover:scale-110">
      <IconHarpyLogo className="h-[60%] w-[60%] text-white" />
    </div>
    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-60 transition-opacity duration-300 group-hover:opacity-100 md:-bottom-12">
      <p className="text-[10px] font-medium tracking-[0.3em] text-gray-500 transition-colors group-hover:text-gray-300 md:text-xs">
        harpy.chat
      </p>
    </div>
  </div>
);

// Astrsk Logo - Scales on desktop
const AstrskLogo = () => (
  <div className="group relative h-14 w-14 cursor-default md:h-24 md:w-24">
    <div className="flex h-full w-full -rotate-3 items-center justify-center transition-all duration-500 group-hover:rotate-3 group-hover:scale-110">
      <AstrskPwaIcon className="h-full w-full" />
    </div>
    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-80 transition-opacity duration-300 group-hover:opacity-100 md:-bottom-12">
      <p className="text-[10px] font-bold tracking-[0.3em] text-white md:text-xs">
        astrsk.ai
      </p>
    </div>
  </div>
);

export function SharedWelcome({ onEnter }: SharedWelcomeProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans text-white selection:bg-accent-primary/30">
      {/* Animated Background Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] animate-blob rounded-full bg-purple-600/30 mix-blend-screen blur-[100px] filter"></div>
        <div className="animation-delay-2000 absolute right-[-20%] top-[-10%] h-[400px] w-[400px] animate-blob rounded-full bg-blue-600/30 mix-blend-screen blur-[100px] filter"></div>
        <div className="animation-delay-4000 absolute bottom-[-20%] left-[20%] h-[600px] w-[600px] animate-blob rounded-full bg-pink-600/20 mix-blend-screen blur-[120px] filter"></div>
        <div className="animation-delay-2000 absolute bottom-[10%] right-[10%] h-[300px] w-[300px] animate-blob rounded-full bg-cyan-600/20 mix-blend-screen blur-[80px] filter"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-12 text-center md:px-12">
        {/* Content Group - Centered vertically */}
        <div className="flex flex-col items-center">
          {/* Transition Visual Group */}
          <div className="mb-12 flex w-full items-center justify-center gap-4 md:mb-20 md:gap-12">
            {/* Harpy Side */}
            <HarpyLogo />

            {/* Animated Arrows */}
            <div className="group relative mx-4 flex w-24 items-center justify-center md:w-48">
              <div className="absolute inset-0 scale-150 rounded-full bg-gray-500/5 blur-xl transition-opacity duration-500 group-hover:opacity-80 md:blur-2xl" />

              <div className="-space-x-5 flex items-center md:-space-x-8">
                <ChevronsRight
                  className="h-10 w-10 text-gray-400 opacity-30 md:h-16 md:w-16"
                  strokeWidth={3}
                />
                <ChevronsRight
                  className="h-10 w-10 text-gray-300 opacity-60 md:h-16 md:w-16"
                  strokeWidth={3}
                />
                <ChevronsRight
                  className="h-10 w-10 text-gray-200 opacity-90 md:h-16 md:w-16"
                  strokeWidth={3}
                />
              </div>
            </div>

            {/* Astrsk Side */}
            <AstrskLogo />
          </div>

          {/* Main Heading */}
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tighter text-white transition-all duration-300 md:mb-10 md:text-7xl">
            YOUR SAGA <br className="md:hidden" /> BEGINS
          </h1>

          {/* Body Text */}
          <p className="mx-auto mb-6 max-w-[320px] text-sm font-normal leading-relaxed tracking-wide text-gray-500 md:mb-16 md:max-w-2xl md:text-xl">
            Your characters are crossing the threshold. The real story starts now in the infinite realms of{" "}
            <span className="font-semibold text-white">
              astrsk.ai
            </span>
            .
          </p>

          {/* Enter Button - Below text on both mobile and desktop */}
          <div className="w-full md:w-auto">
            <button
              onClick={onEnter}
              className="group flex h-16 w-full cursor-pointer items-center justify-center rounded-xl bg-white font-bold text-black shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-gray-200 active:scale-[0.98] md:h-20 md:w-[320px] md:rounded-2xl"
            >
              <span className="relative z-10 flex items-center text-base font-bold uppercase tracking-[0.2em] md:text-lg">
                ENTER WORLD
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.3;
            filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 12px currentColor);
          }
        }
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
