import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { SessionService } from "@/app/services/session-service";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Button } from "@/components-v2/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { StepCharacterCardsSchema } from "@/features/session/mobile/create-session/step-character-cards-mobile";
import { StepCharacterCardsMobile } from "@/features/session/mobile/create-session/step-character-cards-mobile";
import { StepUserCardSchema } from "@/features/session/mobile/create-session/step-user-card-mobile";
import { StepUserCardMobile } from "@/features/session/mobile/create-session/step-user-card-mobile";
import { StepPlotCardSchema } from "@/features/session/mobile/create-session/step-plot-card-mobile";
import { StepPlotCardMobile } from "@/features/session/mobile/create-session/step-plot-card-mobile";
import { convertCombinedCardsFormToSessionProps } from "@/features/session/create-session/step-cards-combined";
import { Session, SessionProps } from "@/modules/session/domain";
import { CardType } from "@/modules/card/domain";

const CombinedCardsSchema =
  StepCharacterCardsSchema.merge(StepUserCardSchema).merge(StepPlotCardSchema);
type CombinedCardsSchemaType = z.infer<typeof CombinedCardsSchema>;

interface EditCardsMobileProps {
  session: Session;
  onSave: (props: Partial<SessionProps>) => Promise<void>;
  onBack: () => void;
  initialTab?: "character" | "user" | "plot";
}

export function EditCardsMobile({
  session,
  onSave,
  onBack,
  initialTab = "character",
}: EditCardsMobileProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Handle Android back gesture
  // useBackGesture({ onBack });

  // Get current card IDs from session
  const currentAiCharacterCardIds =
    session.props.allCards
      ?.filter(
        (card) =>
          card.type === CardType.Character &&
          card.id.toString() !== session.props.userCharacterCardId?.toString(),
      )
      ?.map((card) => card.id.toString()) || [];

  const currentUserCharacterCardId =
    session.props.userCharacterCardId?.toString() || null;

  const currentPlotCardId =
    session.props.allCards
      ?.find((card) => card.type === CardType.Plot)
      ?.id.toString() || null;

  // Use form
  const methods = useForm<CombinedCardsSchemaType>({
    resolver: zodResolver(CombinedCardsSchema),
    defaultValues: {
      aiCharacterCardIds: currentAiCharacterCardIds,
      userCharacterCardId: currentUserCharacterCardId,
      plotCardId: currentPlotCardId,
    },
  });

  // Watch form values for validation
  const aiCharacterCardIds = methods.watch("aiCharacterCardIds");
  const isFormValid = aiCharacterCardIds && aiCharacterCardIds.length > 0;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formValues = methods.getValues();
      const sessionProps = convertCombinedCardsFormToSessionProps(formValues);

      // Call onSave with the session props
      await onSave(sessionProps);
      toast.success("Cards updated");
      onBack();
    } catch (error) {
      // Error handling is done in updateSession
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="bg-background-surface-2 fixed inset-0 z-50">
        {/* Header */}
        <TopNavigation
          title="Cards"
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
              disabled={isSaving || !isFormValid}
              variant="ghost"
              className="h-[40px]"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          }
        />

        {/* Content */}
        <div className="h-[calc(100%)] overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "character" | "plot" | "user")
            }
            className="flex h-full flex-col"
          >
            {/* Tab Navigation */}
            <div className="mx-[16px] mt-[16px]">
              <TabsList
                variant="dark-mobile"
                className="flex w-full overflow-x-auto"
              >
                <TabsTrigger value="character">AI Characters</TabsTrigger>
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="plot">Plot</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent
                value="character"
                className="mt-0 h-full overflow-y-auto"
              >
                <StepCharacterCardsMobile isEdit={true} />
              </TabsContent>

              <TabsContent value="user" className="mt-0 h-full overflow-y-auto">
                <StepUserCardMobile isEdit={true} />
              </TabsContent>

              <TabsContent value="plot" className="mt-0 h-full overflow-y-auto">
                <StepPlotCardMobile isEdit={true} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </FormProvider>
  );
}
