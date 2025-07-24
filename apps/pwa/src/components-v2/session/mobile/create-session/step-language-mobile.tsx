import { Info } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { languages } from "@/shared/utils/translate-utils";

import { Combobox } from "@/components-v2/combobox";
import { cn } from "@/components-v2/lib/utils";

// Re-export schema and converter from the shared step
export { StepLanguageSchema, convertLanguageFormToSessionProps } from "@/components-v2/session/create-session/step-language";
export type StepLanguageSchemaType = z.infer<typeof import("@/components-v2/session/create-session/step-language").StepLanguageSchema>;

// Mobile Language Settings
const LanguageSettingsMobile = () => {
  const { control } = useFormContext<StepLanguageSchemaType>();

  return (
    <div className="flex flex-col gap-[40px]">
      <div className="flex flex-col gap-[24px]">
        <div className="font-[600] text-[18px] leading-[24px] text-text-primary">
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
            <Info
              className="inline-block mb-[4px] mr-[4px]"
              size={12}
            />
            Choose the language of your session. All messages will automatically
            be translate to the chosen language.
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-[24px]">
        <div className="font-[600] text-[18px] leading-[24px] text-text-primary">
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
            <Info
              className="inline-block mb-[4px] mr-[4px]"
              size={12}
            />
            Choose the AI input language. Selecting a specific language translates
            your prompts before it is sent to the AI model for inference.
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Step Language Component
export const StepLanguageMobile = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-[16px] pb-0 flex-1 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-[40px]">
          <div className="text-text-body text-sm font-medium leading-tight">
            Session language & translation preferences
          </div>
          <LanguageSettingsMobile />
        </div>
      </div>
    </div>
  );
};