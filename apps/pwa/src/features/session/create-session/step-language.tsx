import { Info } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { languages } from "@/shared/lib/translate-utils";

import { Combobox } from "@/shared/ui";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib";
import { SessionProps } from "@/entities/session/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";

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
        <div className="text-text-primary text-[20px] leading-[24px] font-[600]">
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
            "text-neutral-500 text-[16px] leading-[19px] font-[400]",
            isMobile ? "text-neutral-300 text-sm leading-tight font-medium" : "",
          )}
        >
          <Info
            className="mr-[4px] mb-[4px] inline-block"
            size={isMobile ? 12 : 16}
          />
          Choose the language of your session. All messages will automatically
          be translate to the chosen language.
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">
        <div className="text-[20px] leading-[24px] font-[600]">
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
            "text-neutral-500 text-[16px] leading-[19px] font-[400]",
            isMobile ? "text-neutral-300 text-sm leading-tight font-medium" : "",
          )}
        >
          <Info
            className="mr-[4px] mb-[4px] inline-block"
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
        "flex flex-col",
        isMobile
          ? "mx-auto w-full max-w-[600px] gap-[40px] px-4"
          : "w-[720px] gap-[56px]",
      )}
    >
      <div
        className={cn(
          isMobile
            ? "text-neutral-300 text-sm leading-tight font-medium"
            : "text-text-primary text-[20px] leading-[24px] font-[600]",
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
