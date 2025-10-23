import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { CustomSheet } from "@/features/session/components/custom-sheet";
import {
  convertLanguageFormToSessionProps,
  LanguageSettings,
  StepLanguageSchema,
  StepLanguageSchemaType,
} from "@/features/session/create-session/step-language";
import { SvgIcon } from "@/components/ui/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { SessionProps } from "@/modules/session/domain/session";
import { TranslationConfig } from "@/modules/session/domain/translation-config";

const EditLanguage = ({
  defaultValue,
  onSave,
  trigger,
}: {
  defaultValue: {
    translation: TranslationConfig;
  };
  onSave: (newValue: Partial<SessionProps>) => Promise<void>;
  trigger?: React.ReactNode;
}) => {
  // Use form
  const methods = useForm<StepLanguageSchemaType>({
    resolver: zodResolver(StepLanguageSchema),
  });

  // Auto-save on form changes
  useEffect(() => {
    const subscription = methods.watch(async (value) => {
      if (
        value.translation?.displayLanguage &&
        value.translation?.promptLanguage
      ) {
        await onSave({
          ...convertLanguageFormToSessionProps(value as StepLanguageSchemaType),
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, onSave]);

  return (
    <CustomSheet
      title="Language"
      trigger={trigger ?? <SvgIcon name="edit" size={24} />}
      onOpenChange={(open) => {
        if (open) {
          methods.reset({
            translation: {
              displayLanguage: defaultValue.translation.displayLanguage,
              promptLanguage: defaultValue.translation.promptLanguage,
            },
          });
        }
      }}
    >
      <FormProvider {...methods}>
        <LanguageSettings />
      </FormProvider>
    </CustomSheet>
  );
};

export { EditLanguage };
