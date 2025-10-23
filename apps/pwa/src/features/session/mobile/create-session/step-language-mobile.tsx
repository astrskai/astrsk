import { Info } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { languages } from "@/shared/utils/translate-utils";

import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/components-v2/lib/utils";

// Re-export schema and converter from the shared step
export {
  StepLanguageSchema,
  convertLanguageFormToSessionProps,
} from "@/features/session/create-session/step-language";
export type StepLanguageSchemaType = z.infer<
  typeof import("@/features/session/create-session/step-language").StepLanguageSchema
>;

// Mobile Language Settings
const LanguageSettingsMobile = () => {
  const { control } = useFormContext<StepLanguageSchemaType>();

  return (
    <div className="flex flex-col gap-[40px]">
      <div className="flex flex-col gap-[24px]">
        <div className="text-text-primary text-[18px] leading-[24px] font-[600]">
          Displayed language
        </div>
        <div className="flex flex-col gap-[8px]">
          <Controller
            control={control}
            name="translation.displayLanguage"
            render={({ field: { onChange, value } }) => (
              <Combobox
                label="Language"
                triggerPlaceholder="Language"
                searchPlaceholder="Search languages..."
                searchEmpty="No language found."
                options={languages}
                value={value || "none"}
                onValueChange={(selectedValue) => {
                  onChange(selectedValue);
                }}
                forceMobile={true}
              />
            )}
          />
          <div className="text-text-placeholder text-xs font-normal">
            <Info className="mr-[4px] mb-[4px] inline-block" size={12} />
            Choose the language of your session. All messages will automatically
            be translate to the chosen language.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[24px]">
        <div className="text-text-primary text-[18px] leading-[24px] font-[600]">
          AI understanding language
        </div>
        <div className="flex flex-col gap-[8px]">
          <Controller
            control={control}
            name="translation.promptLanguage"
            render={({ field: { onChange, value } }) => (
              <Combobox
                label="Language"
                triggerPlaceholder="Prompt language"
                searchPlaceholder="Search languages..."
                searchEmpty="No language found."
                options={languages}
                value={value || "none"}
                onValueChange={(selectedValue) => {
                  onChange(selectedValue);
                }}
                forceMobile={true}
              />
            )}
          />
          <div className="text-text-placeholder text-xs font-normal">
            <Info className="mr-[4px] mb-[4px] inline-block" size={12} />
            Choose the AI input language. Selecting a specific language
            translates your prompts before it is sent to the AI model for
            inference.
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Step Language Component
export const StepLanguageMobile = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-y-auto p-[16px] pb-0">
        <div className="flex flex-col gap-[40px]">
          <div className="text-text-body text-sm leading-tight font-medium">
            Session language & translation preferences
          </div>
          <LanguageSettingsMobile />
        </div>
      </div>
    </div>
  );
};
