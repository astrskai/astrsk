import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";

import { SessionService } from "@/app/services/session-service";
import { TopNavigation } from "@/components-v2/top-navigation";
import { Button } from "@/components-v2/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import {
  convertChatStylingFormToSessionProps,
  StepChatStylingSchema,
  StepChatStylingSchemaType,
} from "@/components-v2/session/mobile/create-session/step-chat-styling-mobile";
import {
  StylingPreview,
  StylingSettings,
} from "@/components-v2/session/mobile/create-session/step-chat-styling-mobile";
import { StepBackgroundSchemaType } from "@/components-v2/session/mobile/create-session/step-background-mobile";
import { Session, SessionProps } from "@/modules/session/domain";
import { CardType } from "@/modules/card/domain";

interface EditChatStylingMobileProps {
  session: Session;
  onSave: (props: Partial<SessionProps>) => Promise<void>;
  onBack: () => void;
}

export function EditChatStylingMobile({
  session,
  onSave,
  onBack,
}: EditChatStylingMobileProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Handle Android back gesture
  // useBackGesture({ onBack });

  // Get character card IDs for styling preview
  const aiCharacterCardId = session.props.allCards?.find(
    (card) =>
      card.type === CardType.Character &&
      card.id.toString() !== session.props.userCharacterCardId?.toString(),
  )?.id;
  const userCharacterCardId = session.props.userCharacterCardId;

  // Use form
  const methods = useForm<StepChatStylingSchemaType & StepBackgroundSchemaType>(
    {
      resolver: zodResolver(StepChatStylingSchema),
      defaultValues: {
        chatStyles: session.props.chatStyles,
        backgroundId: session.props.backgroundId?.toString(),
      },
    },
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formValues = methods.getValues();
      const sessionProps = convertChatStylingFormToSessionProps(formValues);

      await onSave(sessionProps);
      toast.success("Chat styling updated");
      onBack();
    } catch (error) {
      toast.error("Failed to update chat styling", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="fixed inset-0 z-50 bg-background-surface-2">
        {/* Header */}
        <TopNavigation
          title="Message styling"
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
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="ghost"
              className="h-[40px]"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          }
        />

        {/* Content - Mobile layout from StepChatStyling */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
          <div className="w-full h-full max-w-[600px] mx-auto px-4 py-6 flex-1">
            <Tabs defaultValue="styling" className="w-full h-full">
              <TabsList
                variant="dark-mobile"
                className="flex w-full overflow-x-auto"
              >
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="styling">
                <StylingSettings />
              </TabsContent>

              <TabsContent value="preview" className="h-[calc(100%-140px)]">
                <p className="text-xs text-text-placeholder pb-[24px]">
                  View how your changes will affect the session experience.
                </p>
                <StylingPreview
                  container="edit-chat-styling-preview-mobile"
                  chatStyles={methods.watch("chatStyles")}
                  backgroundId={
                    methods.watch("backgroundId")
                      ? new UniqueEntityID(methods.watch("backgroundId")!)
                      : undefined
                  }
                  className="h-full items-center"
                  characterCardId={aiCharacterCardId}
                  userCharacterCardId={userCharacterCardId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
