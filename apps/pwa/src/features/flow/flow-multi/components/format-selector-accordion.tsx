import { ChevronDown } from "lucide-react";
import { ApiType } from "@/entities/agent/domain/agent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui";
import { cn } from "@/shared/lib";

interface FormatSelectorAccordionProps {
  value: ApiType;
  onChange: (value: ApiType) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  isStandalone?: boolean;
}

export function FormatSelectorAccordion({
  value,
  onChange,
  isOpen = true,
  onOpenChange,
  className,
  isStandalone = false,
}: FormatSelectorAccordionProps) {
  const handleValueChange = (openValue: string[]) => {
    const isNowOpen = openValue.includes("format");
    onOpenChange?.(isNowOpen);
  };

  return (
    <Accordion
      type="multiple"
      value={isOpen ? ["format"] : []}
      onValueChange={handleValueChange}
      className={cn("w-80", className)}
    >
      <AccordionItem value="format" className="border border-border-dark">
        <div className="px-2 py-2.5 bg-background-surface-2">
          <AccordionTrigger className="p-0 hover:no-underline">
            <div className="self-stretch inline-flex justify-between items-center w-full">
              <div className="flex justify-start items-center gap-2">
                <div className="justify-start text-text-secondary text-xs font-medium">
                  {isStandalone ? "Prompt Editor" : "Prompt"}:
                </div>
                <div className="justify-start text-text-secondary text-xs font-medium">
                  {value === ApiType.Chat ? "Chat completion" : "Text completion"}
                  {isStandalone && " (Standalone Mode)"}
                </div>
              </div>
              <div className="flex justify-start items-center gap-4">
                <ChevronDown className="w-6 h-6 text-text-body transition-transform duration-200" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2.5 pb-0">
            <div className="px-2 flex flex-col justify-start items-start gap-2">
              <button
                onClick={() => onChange(ApiType.Chat)}
                className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer"
              >
                <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                  {value === ApiType.Chat && (
                    <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                  )}
                </div>
                <div className="justify-start text-text-primary text-xs font-medium">Chat completion</div>
              </button>
              <button
                onClick={() => onChange(ApiType.Text)}
                className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer"
              >
                <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                  {value === ApiType.Text && (
                    <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                  )}
                </div>
                <div className="justify-start text-text-primary text-xs font-medium">Text completion</div>
              </button>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}