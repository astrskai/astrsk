import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { SessionService } from "@/app/services/session-service";
import { TopNavigation } from "@/components-v2/top-navigation";
import { Button } from "@/components-v2/ui/button";
import {
  convertLanguageFormToSessionProps,
  StepLanguageSchema,
  StepLanguageSchemaType,
} from "@/components-v2/session/mobile/create-session/step-language-mobile";
import {
  LanguageSettings,
} from "@/components-v2/session/create-session/step-language";
import { Session, SessionProps } from "@/modules/session/domain";

interface EditLanguageMobileProps {
  session: Session;
  onSave: (props: Partial<SessionProps>) => Promise<void>;
  onBack: () => void;
}

export function EditLanguageMobile({
  session,
  onSave,
  onBack,
}: EditLanguageMobileProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Handle Android back gesture
  // useBackGesture({ onBack });

  // Use form
  const methods = useForm<StepLanguageSchemaType>({
    resolver: zodResolver(StepLanguageSchema),
    defaultValues: {
      translation: {
        displayLanguage: session.props.translation?.displayLanguage || "none",
        promptLanguage: session.props.translation?.promptLanguage || "none",
      },
    },
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formValues = methods.getValues();
      const sessionProps = convertLanguageFormToSessionProps(formValues);

      await onSave(sessionProps);
      toast.success("Language settings updated");
      onBack();
    } catch (error) {
      // Error handling is done in updateSession
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="fixed inset-0 z-50 bg-background-surface-2">
        {/* Header */}
        <TopNavigation
          title="Language & Translation"
          leftAction={
            <Button
              variant="ghost_white"
              size="icon"
              onClick={onBack}
              className="h-[40px] w-[40px] p-[8px]"
            >
              <ChevronLeft className="min-h-6 min-w-6" />
            </Button>
          }
          rightAction={
            <Button onClick={handleSave} disabled={isSaving} variant="ghost">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          }
        />

        {/* Content - Mobile layout from StepLanguage */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto py-[24px]">
          <div className="w-full max-w-[600px] mx-auto px-4 flex flex-col gap-[56px]">
            <LanguageSettings />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
