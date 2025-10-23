import React from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/shared/lib";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface ScenarioItemProps {
  name: string;
  contents: string;
  active?: boolean;
  onClick?: () => void;
}

export const ScenarioItem: React.FC<ScenarioItemProps> = ({
  name,
  contents,
  active = false,
  onClick,
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "self-stretch p-4 bg-background-surface-4 rounded flex flex-col justify-start items-start gap-2 cursor-pointer border-2",
        active ? "border-border-selected-primary" : "border-transparent",
      )}
      onClick={onClick}
    >
      <div className="self-stretch justify-start text-text-body text-base font-normal">
        {name}
      </div>
      {!isMobile && contents && (
        <Markdown
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          className="markdown self-stretch justify-start text-text-body text-sm font-normal opacity-70"
        >
          {contents}
        </Markdown>
      )}
    </div>
  );
};
