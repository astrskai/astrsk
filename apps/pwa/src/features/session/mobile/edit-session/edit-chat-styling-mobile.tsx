import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";

import { TopNavigation } from "@/widgets/top-navigation";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";
import {
  convertChatStylingFormToSessionProps,
  StepChatStylingSchema,
  StepChatStylingSchemaType,
} from "@/features/session/mobile/create-session/step-chat-styling-mobile";
import {
  StylingPreview,
  StylingSettings,
} from "@/features/session/mobile/create-session/step-chat-styling-mobile";
import { StepBackgroundSchemaType } from "@/features/session/mobile/create-session/step-background-mobile";
import { Session, SessionProps } from "@/entities/session/domain";
import { CardType } from "@/entities/card/domain";

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
      <div className="bg-background-surface-2 fixed inset-0 z-50">
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
          <div className="mx-auto h-full w-full max-w-[600px] flex-1 px-4 py-6">
            <Tabs defaultValue="styling" className="h-full w-full">
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
                <p className="text-text-placeholder pb-[24px] text-xs">
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
