import { ChevronDown } from "lucide-react";
import { OutputFormat } from "@/modules/agent/domain/agent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { cn } from "@/shared/lib";
import { Switch } from "@/shared/ui/switch";

interface OutputFormatSelectorProps {
  value: {
    enabledStructuredOutput: boolean;
    outputStreaming: boolean;
  };
  onChange: (enabled: boolean) => void;
  onStreamingChange?: (streaming: boolean) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  isStandalone?: boolean;
}

export function OutputFormatSelector({ 
  value, 
  onChange, 
  onStreamingChange,
  isOpen = true,
  onOpenChange,
  disabled,
  hasError,
  className,
  isStandalone = false
}: OutputFormatSelectorProps) {
  const handleValueChange = (openValue: string[]) => {
    const isNowOpen = openValue.includes("format");
    onOpenChange?.(isNowOpen);
  };

  return (
    <Accordion
      type="multiple"
      value={isOpen ? ["format"] : []}
      onValueChange={handleValueChange}
      className={cn("w-full", className)}
    >
      <AccordionItem value="format" className="border-0">
        <div className={cn("px-2 py-2.5 bg-background-surface-2 border", hasError ? "border-2 border-status-destructive-light" : "border-border-dark")}>
          <AccordionTrigger className="p-0 hover:no-underline" disabled={disabled}>
            <div className="self-stretch inline-flex justify-between items-center w-full">
              <div className="flex justify-start items-center gap-2">
                <div className="justify-start text-text-secondary text-xs font-medium">
                  {isStandalone ? "Output Editor" : "Output"}:
                </div>
                <div className="justify-start text-text-secondary text-xs font-medium">
                  {value.enabledStructuredOutput ? "Structured output" : "Text output"}
                  {" / "}
                  {value.outputStreaming ? "Stream response On" : "Stream response Off"}
                  {isStandalone && " (Standalone Mode)"}
                </div>
              </div>
              <div className="flex justify-start items-center gap-4">
                <ChevronDown className="w-6 h-6 text-text-body transition-transform duration-200" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2.5 pb-0 flex flex-col gap-2">
            <div className="px-2 flex flex-col justify-start items-start gap-2">
              <button
                onClick={() => onChange(true)}
                disabled={disabled}
                className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                  {value.enabledStructuredOutput && (
                    <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                  )}
                </div>
                <div className="justify-start text-text-primary text-xs font-medium">Structured output</div>
              </button>
              <button
                onClick={() => onChange(false)}
                disabled={disabled}
                className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                  {!value.enabledStructuredOutput && (
                    <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                  )}
                </div>
                <div className="justify-start text-text-primary text-xs font-medium">Text(response) output</div>
              </button>
            </div>
            <div className="px-2 py-2.5 flex flex-row justify-start items-center gap-2">
              <Switch
                checked={value.outputStreaming}
                onCheckedChange={onStreamingChange || (() => {})}
                size="small"
              />
              <div className="flex flex-col gap-1">
                <div className="justify-start text-text-secondary text-xs font-medium">Stream response: {value.outputStreaming ? "On" : "Off"}</div>
                <div className="justify-start text-text-info text-xs font-medium">Turn off streaming to receive full response only after generation</div>
              </div>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}