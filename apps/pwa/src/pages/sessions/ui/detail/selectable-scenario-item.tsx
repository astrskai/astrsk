import React from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/shared/lib";

interface SelectableScenarioItemProps {
  name: string;
  contents: string;
  active?: boolean;
  onClick?: () => void;
}

const SelectableScenarioItem = ({
  name,
  contents,
  active = false,
  onClick,
}: SelectableScenarioItemProps) => {
  return (
    <div
      className={cn(
        "bg-background-surface-4 flex cursor-pointer flex-col items-start justify-start gap-2 self-stretch rounded border-2 p-4",
        active ? "border-border-selected-primary" : "border-transparent",
      )}
      onClick={onClick}
    >
      <div className="text-text-body justify-start self-stretch text-base font-normal break-words">
        {name}
      </div>
      {contents && (
        <Markdown
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          className="markdown text-text-body overflow-wrap-anywhere justify-start self-stretch text-sm font-normal break-words opacity-70"
        >
          {contents}
        </Markdown>
      )}
    </div>
  );
};

export default SelectableScenarioItem;
