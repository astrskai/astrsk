import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

import { SessionService } from "@/app/services/session-service";
import { Page, useAppStore } from "@/shared/stores/app-store";
import { useSessionStore } from "@/shared/stores/session-store";
import { useValidationStore } from "@/shared/stores/validation-store";
import { queryClient } from "@/shared/api/query-client";
import { BackgroundService } from "@/app/services/background-service";
import { fetchBackgrounds } from "@/shared/stores/background-store";
import { StepperMobile } from "@/shared/ui";
import {
  convertBackgroundFormToSessionProps,
  StepBackgroundSchema,
} from "@/features/session/create-session/step-background";
import { StepBackgroundMobile } from "./create-session/step-background-mobile";
import { StepCharacterCardsSchema } from "@/features/session/create-session/step-character-cards";
import { StepCharacterCardsMobile } from "./create-session/step-character-cards-mobile";
import { StepUserCardSchema } from "@/features/session/create-session/step-user-card";
import { StepUserCardMobile } from "./create-session/step-user-card-mobile";
import { StepPlotCardSchema } from "@/features/session/create-session/step-plot-card";
import { StepPlotCardMobile } from "./create-session/step-plot-card-mobile";
import { convertCombinedCardsFormToSessionProps } from "@/features/session/create-session/step-cards-combined";
import {
  convertChatStylingFormToSessionProps,
  StepChatStylingSchema,
} from "@/features/session/create-session/step-chat-styling";
import { StepChatStylingMobile } from "./create-session/step-chat-styling-mobile";
import {
  convertFlowAndAgentsFormToSessionProps,
  StepFlowAndAgentsSchema,
} from "@/features/session/create-session/step-flow-and-agents";
import { StepFlowAndAgentsMobile } from "./create-session/step-flow-and-agents-mobile";
import {
  convertLanguageFormToSessionProps,
  StepLanguageSchema,
} from "@/features/session/create-session/step-language";
import { StepLanguageMobile } from "./create-session/step-language-mobile";
import { TableName } from "@/db/schema/table-name";
import { Session } from "@/entities/session/domain";
import { defaultChatStyles } from "@/entities/session/domain/chat-styles";

const SessionSchema = StepCharacterCardsSchema.merge(StepUserCardSchema)
  .merge(StepPlotCardSchema)
  .merge(StepFlowAndAgentsSchema)
  .merge(StepLanguageSchema)
  .merge(StepBackgroundSchema)
  .merge(StepChatStylingSchema);

type SessionSchemaType = z.infer<typeof SessionSchema>;

interface CreateSessionPageMobileProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSessionCreated?: (sessionId: string) => void;
}

export default function CreateSessionPageMobile({
  isOpen = false,
  onClose,
  onSessionCreated,
}: CreateSessionPageMobileProps) {
  const { createSessionName } = useSessionStore();
  const { setActivePage } = useAppStore();
  const { selectSession } = useSessionStore();

  // Use form
  const methods = useForm<SessionSchemaType>({
    mode: "onChange",
    defaultValues: {
      flowId: "",
      userCharacterCardId: null,
      aiCharacterCardIds: [],
      plotCardId: null,
      chatStyles: defaultChatStyles,
      translation: {
        displayLanguage: "none",
        promptLanguage: "none",
      },
    },
    resolver: zodResolver(SessionSchema),
  });

  // Validate form
  const { watch } = methods;
  const [validation, setValidation] = useState<{
    [index: number]: boolean;
  }>({
    1: true, // User card (optional)
    2: true, // Plot card (optional)
    4: true, // Language (optional)
    5: true, // Background (optional)
    6: true, // Chat styling (optional)
  });

  // Validate step character cards (Step 0)
  const aiCharacterCardIds = watch("aiCharacterCardIds");
  useEffect(() => {
    const validationStepCharacterCards = StepCharacterCardsSchema.safeParse({
      aiCharacterCardIds,
    });
    setValidation((prev) => ({
      ...prev,
      0: validationStepCharacterCards.success,
    }));
  }, [aiCharacterCardIds]);

  // Validate step flow and agents (Step 3)
  const flowId = watch("flowId") ?? "";
  const { invalids } = useValidationStore();
  useEffect(() => {
    const parsed = StepFlowAndAgentsSchema.safeParse({
      flowId,
    });
    const isValid = !invalids.get("flows")?.[flowId];
    setValidation((prev) => ({
      ...prev,
      3: parsed.success && isValid,
    }));
  }, [flowId, invalids]);

  // Handle add new background
  const handleAddNewBackground = useCallback(async (file: File) => {
    // Save file to background
    const backgroundOrError =
      await BackgroundService.saveFileToBackground.execute(file);
    if (backgroundOrError.isFailure) {
      return;
    }

    // Refresh backgrounds
    fetchBackgrounds();
  }, []);

  // Handle finish
  const handleFinish = useCallback(async () => {
    try {
      // Create session
      const formValues = methods.getValues();
      const sessionOrError = Session.create({
        title: createSessionName,
        ...convertFlowAndAgentsFormToSessionProps(formValues),
        ...convertCombinedCardsFormToSessionProps(formValues),
        ...convertLanguageFormToSessionProps(formValues),
        ...convertBackgroundFormToSessionProps(formValues),
        ...convertChatStylingFormToSessionProps(formValues),
      });
      if (sessionOrError.isFailure) {
        logger.error(sessionOrError.getError());
        return false;
      }
      const session = sessionOrError.getValue();

      // Save session
      const savedSessionOrError = await SessionService.saveSession.execute({
        session: session,
      });
      if (savedSessionOrError.isFailure) {
        logger.error(savedSessionOrError.getError());
        return false;
      }
      const savedSession = savedSessionOrError.getValue();

      // Select saved session
      selectSession(savedSession.id, savedSession.title);

      // Invalidate sessions
      await queryClient.invalidateQueries({
        queryKey: [TableName.Sessions],
      });

      // Reset form after successful creation
      methods.reset();

      // Close modal and notify parent about the created session
      onClose?.();
      onSessionCreated?.(savedSession.id.toString());

      return true;
    } catch (error) {
      logger.error("Failed to create session", error);
      return false;
    }
  }, [createSessionName, methods, selectSession, setActivePage, onClose]);

  const handleCancel = useCallback(() => {
    // Reset form
    methods.reset();
    // Close modal
    onClose?.();
  }, [methods, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      methods.reset();
    }
  }, [isOpen, methods]);

  const stepTitles = [
    "Step 1-1: Cards",
    "Step 1-2: Cards",
    "Step 1-3: Cards",
    "Step 2: Flow & Agent",
    "Step 3: Language",
    "Step 4: Background",
    "Step 5: Message Styling",
  ];

  return (
    <FormProvider {...methods}>
      <StepperMobile
        title={`Create session: ${createSessionName}`}
        stepTitles={stepTitles}
        steps={[
          {
            label: "AI Characters",
            content: <StepCharacterCardsMobile />,
          },
          {
            label: "Your Character",
            content: <StepUserCardMobile />,
          },
          {
            label: "Plot",
            content: <StepPlotCardMobile />,
          },
          {
            label: "Flow & Agent",
            content: <StepFlowAndAgentsMobile />,
          },
          {
            label: "Language",
            content: <StepLanguageMobile />,
          },
          {
            label: "Background",
            content: (
              <StepBackgroundMobile
                handleAddNewBackground={handleAddNewBackground}
              />
            ),
          },
          {
            label: "Message Styling",
            content: (
              <StepChatStylingMobile
                characterCardId={
                  aiCharacterCardIds && aiCharacterCardIds.length > 0
                    ? new UniqueEntityID(aiCharacterCardIds[0])
                    : undefined
                }
                userCharacterCardId={
                  watch("userCharacterCardId")
                    ? new UniqueEntityID(watch("userCharacterCardId")!)
                    : undefined
                }
              />
            ),
          },
        ]}
        validation={validation}
        onCancel={handleCancel}
        onFinish={handleFinish}
        isOpen={isOpen}
      />
    </FormProvider>
  );
}
