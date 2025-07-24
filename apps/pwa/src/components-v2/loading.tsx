"use client";

import { useEffect, useRef, useState } from "react";

import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Progress } from "@/components-v2/ui/progress";

const titles = [
  "Getting things ready — locally",
  "You own your data",
  "You’re in control",
];
const description = [
  "Your database is built on your local device.",
  "Your stories, messages, and creations",
  "You have complete ownership of your data",
  "",
];
const description2 = [
  "",
  "live only on your machine.",
  "and exclusive control over its use and distribution.",
];

export const Loading = ({ isTimer }: { isTimer?: boolean }) => {
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const totalTime = 20000; // 20 seconds in milliseconds
    const interval = 200; // Update every 200ms
    const incrementPerInterval = (100 * interval) / totalTime;

    timer.current = window.setInterval(() => {
      if (progress < 100) {
        const nextProgress = Math.min(progress + incrementPerInterval, 100);
        setProgress(nextProgress);
      } else {
        if (isTimer) {
          setProgress(0);
        } else if (timer.current) {
          clearInterval(timer.current);
        }
      }
    }, interval);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [progress]);

  return (
    <div
      className={`z-120 flex items-center justify-center ${
        isMobile
          ? "fixed inset-0 w-screen h-screen"
          : "w-full h-full bg-background-screen"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-8 px-4">
        <div
          className="animate-spin-slow"
          style={{
            width: isMobile ? "90px" : "120px",
            height: isMobile ? "90px" : "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon name="astrsk_symbol" size={isMobile ? 90 : 120} />
        </div>
        {isTimer && (
          <>
            <div className="flex flex-col gap-4">
              <div
                className={`${
                  isMobile
                    ? "w-full max-w-[320px] text-2xl"
                    : "w-[470px] text-3xl"
                } font-semibold text-text-primary text-center`}
              >
                {progress < 30
                  ? titles[0]
                  : progress < 60
                    ? titles[1]
                    : titles[2]}
              </div>

              <div className="flex flex-col gap-0 items-top h-auto min-h-[48px]">
                <div
                  className={`${
                    isMobile
                      ? "w-full max-w-[320px] text-sm"
                      : "w-[470px] text-base"
                  } text-text-secondary text-center`}
                >
                  {progress < 30
                    ? description[0]
                    : progress < 60
                      ? description[1]
                      : description[2]}
                </div>
                <div
                  className={`${
                    isMobile
                      ? "w-full max-w-[320px] text-sm"
                      : "w-[470px] text-base"
                  } text-text-secondary text-center`}
                >
                  {progress < 30
                    ? description2[0]
                    : progress < 60
                      ? description2[1]
                      : description2[2]}
                </div>
              </div>
            </div>
            <Progress
              className={`mt-10 ${isMobile ? "w-[280px]" : "w-[326px]"}`}
              value={progress}
            />
          </>
        )}
      </div>
    </div>
  );
};
