import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib";

/**
 * Accordion Item Structure
 */
export interface AccordionItemConfig {
  /**
   * Unique identifier for the accordion item
   */
  value: string;
  /**
   * Trigger content (can be string or ReactNode)
   */
  title: React.ReactNode;
  /**
   * Content displayed when accordion is expanded
   */
  content: React.ReactNode;
  /**
   * Optional: Disable this specific item
   */
  disabled?: boolean;
}

/**
 * Accordion Base Props
 */
export interface AccordionBaseProps {
  /**
   * Array of accordion items
   */
  items: AccordionItemConfig[];
  /**
   * Accordion type
   * - "single": Only one item can be open at a time
   * - "multiple": Multiple items can be open simultaneously
   * @default "single"
   */
  type?: "single" | "multiple";
  /**
   * Default value(s) for controlled/uncontrolled state
   * - For "single": string
   * - For "multiple": string[]
   */
  defaultValue?: string | string[];
  /**
   * Controlled value(s)
   * - For "single": string
   * - For "multiple": string[]
   */
  value?: string | string[];
  /**
   * Callback when value changes
   */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Whether items are collapsible when type is "single"
   * @default true
   */
  collapsible?: boolean;
  /**
   * Additional CSS class for root element
   */
  className?: string;
  /**
   * Additional CSS class for accordion items
   */
  itemClassName?: string;
  /**
   * Additional CSS class for trigger button
   */
  triggerClassName?: string;
  /**
   * Additional CSS class for content
   */
  contentClassName?: string;
  /**
   * Show chevron icon in trigger
   * @default true
   */
  showChevron?: boolean;
}

/**
 * Reusable Accordion Component (Array-based API)
 *
 * Features:
 * - Single or multiple item expansion
 * - Controlled/uncontrolled modes
 * - Flexible content with ReactNode support
 * - Smooth animations
 * - Accessible (ARIA attributes)
 *
 * Usage:
 * ```tsx
 * <AccordionBase
 *   items={[
 *     { value: "item-1", title: "Section 1", content: <div>Content 1</div> },
 *     { value: "item-2", title: "Section 2", content: <div>Content 2</div> },
 *   ]}
 *   type="single"
 *   collapsible
 * />
 * ```
 */
const AccordionBase = ({
  items,
  type = "single",
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  className,
  itemClassName,
  triggerClassName,
  contentClassName,
  showChevron = true,
}: AccordionBaseProps) => {
  // Build root props based on type
  const rootProps =
    type === "single"
      ? {
          type: "single" as const,
          collapsible,
          ...(defaultValue !== undefined && {
            defaultValue: defaultValue as string,
          }),
          ...(value !== undefined && { value: value as string }),
          ...(onValueChange && {
            onValueChange: onValueChange as (value: string) => void,
          }),
        }
      : {
          type: "multiple" as const,
          ...(defaultValue !== undefined && {
            defaultValue: defaultValue as string[],
          }),
          ...(value !== undefined && { value: value as string[] }),
          ...(onValueChange && {
            onValueChange: onValueChange as (value: string[]) => void,
          }),
        };

  return (
    <AccordionPrimitive.Root
      {...rootProps}
      className={cn("w-full space-y-2", className)}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={cn(
            "overflow-hidden rounded-lg border border-gray-500 bg-transparent",
            "data-[state=open]:bg-gray-900",
            "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
            itemClassName,
          )}
        >
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
              className={cn(
                "group flex flex-1 items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium transition-all",
                "hover:bg-gray-800",
                "data-[state=open]:bg-gray-900",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                triggerClassName,
              )}
            >
              <span className="flex-1 text-gray-200">{item.title}</span>
              {showChevron && (
                <ChevronDown
                  className={cn(
                    "text-text-secondary h-5 w-5 shrink-0 transition-transform duration-200",
                    "group-data-[state=open]:rotate-180",
                  )}
                />
              )}
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content
            className={cn(
              "overflow-hidden transition-all",
              "data-[state=closed]:animate-accordion-up",
              "data-[state=open]:animate-accordion-down",
            )}
          >
            <div
              className={cn(
                "text-text-secondary px-4 pt-2 pb-4 text-sm",
                contentClassName,
              )}
            >
              {item.content}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
};

export default AccordionBase;
