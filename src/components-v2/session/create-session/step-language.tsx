import { Info } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { languages } from "@/shared/utils/translate-utils";

import { Combobox } from "@/components-v2/combobox";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { SessionProps } from "@/modules/session/domain";
import { TranslationConfig } from "@/modules/session/domain/translation-config";

const StepLanguageSchema = z.object({
  translation: z.object({
    displayLanguage: z.string().nullable(),
    promptLanguage: z.string().nullable(),
  }),
});

type StepLanguageSchemaType = z.infer<typeof StepLanguageSchema>;

const LanguageSettings = () => {
  const { control } = useFormContext<StepLanguageSchemaType>();

  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-[40px]">
      <div className="flex flex-col gap-[24px]">
        <div className="font-[600] text-[20px] leading-[24px] text-text-primary">
          {isMobile ? "" : "1."} Displayed language
        </div>
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
        <div
          className={cn(
            "font-[400] text-[16px] leading-[19px] text-text-info",
            isMobile ? "text-text-body text-sm font-medium leading-tight" : "",
          )}
        >
          <Info
            className="inline-block mb-[4px] mr-[4px]"
            size={isMobile ? 12 : 16}
          />
          Choose the language of your session. All messages will automatically
          be translate to the chosen language.
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">
        <div className="font-[600] text-[20px] leading-[24px]">
          {isMobile ? "" : "2."} AI understanding language
        </div>
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
        <div
          className={cn(
            "font-[400] text-[16px] leading-[19px] text-text-info",
            isMobile ? "text-text-body text-sm font-medium leading-tight" : "",
          )}
        >
          <Info
            className="inline-block mb-[4px] mr-[4px]"
            size={isMobile ? 12 : 16}
          />
          Choose the AI input language. Selecting a specific language translates
          your prompts before it is sent to the AI model for inference.
        </div>
      </div>
    </div>
  );
};

const StepLanguage = () => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "flex flex-col ",
        isMobile
          ? "w-full max-w-[600px] mx-auto px-4 gap-[40px]"
          : "w-[720px] gap-[56px]",
      )}
    >
      <div
        className={cn(
          isMobile
            ? "text-text-body text-sm font-medium leading-tight"
            : "font-[600] text-[20px] text-text-primary leading-[24px]",
        )}
      >
        Session language & translation preferences
      </div>
      <LanguageSettings />
    </div>
  );
};

function convertLanguageFormToSessionProps(
  values: StepLanguageSchemaType,
): Partial<SessionProps> {
  return {
    translation: TranslationConfig.create({
      displayLanguage: values.translation.displayLanguage ?? "none",
      promptLanguage: values.translation.promptLanguage ?? "none",
    }).getValue(),
  };
}

export {
  convertLanguageFormToSessionProps,
  LanguageSettings,
  StepLanguage,
  StepLanguageSchema,
};
export type { StepLanguageSchemaType };
