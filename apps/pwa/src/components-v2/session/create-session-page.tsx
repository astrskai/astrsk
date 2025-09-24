import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils";

import { SessionService } from "@/app/services/session-service";
import { Page, useAppStore } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useValidationStore } from "@/app/stores/validation-store";
import { queryClient } from "@/app/queries/query-client";
import { cn } from "@/components-v2/lib/utils";
import {
  convertBackgroundFormToSessionProps,
  StepBackground,
  StepBackgroundSchema,
} from "@/components-v2/session/create-session/step-background";
import {
  convertCardsFormToSessionProps,
  StepCards,
  StepCardsSchema,
} from "@/components-v2/session/create-session/step-cards";
import {
  convertChatStylingFormToSessionProps,
  StepChatStyling,
  StepChatStylingSchema,
} from "@/components-v2/session/create-session/step-chat-styling";
import {
  convertFlowAndAgentsFormToSessionProps,
  StepFlowAndAgents,
  StepFlowAndAgentsSchema,
} from "@/components-v2/session/create-session/step-flow-and-agents";
import {
  convertLanguageFormToSessionProps,
  StepLanguage,
  StepLanguageSchema,
} from "@/components-v2/session/create-session/step-language";
import { Stepper } from "@/components-v2/stepper";
import { TableName } from "@/db/schema/table-name";
import { Session } from "@/modules/session/domain";
import { defaultChatStyles } from "@/modules/session/domain/chat-styles";

const SessionSchema = StepFlowAndAgentsSchema.merge(StepCardsSchema)
  .merge(StepLanguageSchema)
  .merge(StepBackgroundSchema)
  .merge(StepChatStylingSchema);

type SessionSchemaType = z.infer<typeof SessionSchema>;

export default function CreateSessionPage({
  className,
}: {
  className?: string;
}) {
  const { createSessionName } = useSessionStore();
  const navigate = useNavigate();

  // Use form
  const methods = useForm<SessionSchemaType>({
    mode: "onChange",
    defaultValues: {
      flowId: "",
      userCharacterCardId: null,
      aiCharacterCardIds: [],
      plotCardId: null,
      chatStyles: defaultChatStyles,
    },
    resolver: zodResolver(SessionSchema),
  });

  // Validate form
  const { watch } = methods;
  const [validation, setValidation] = useState<{
    [index: number]: boolean;
  }>({
    2: true,
    3: true,
    4: true,
  });

  // Validate step flow and agents
  const flowId = watch("flowId") ?? "";
  const { invalids } = useValidationStore();
  useEffect(() => {
    // Parse step flow and agents
    const parsed = StepFlowAndAgentsSchema.safeParse({
      flowId,
    });

    // Check validation store
    const isValid = !invalids.get("flows")?.[flowId];

    // Set validation
    setValidation((prev) => ({
      ...prev,
      1: parsed.success && isValid,
    }));
  }, [flowId, invalids]);

  // Validate step cards
  const userCharacterCardId = watch("userCharacterCardId");
  const aiCharacterCardIds = watch("aiCharacterCardIds");
  const plotCardId = watch("plotCardId");
  useEffect(() => {
    const validationStepCards = StepCardsSchema.safeParse({
      userCharacterCardId,
      aiCharacterCardIds,
      plotCardId,
    });
    setValidation((prev) => ({
      ...prev,
      0: validationStepCards.success,
    }));
  }, [userCharacterCardId, aiCharacterCardIds, plotCardId]);

  // Handle finish
  const { setActivePage } = useAppStore();
  const { selectSession } = useSessionStore();
  const handleFinish = useCallback(async () => {
    // Create session
    const formValues = methods.getValues();
    const sessionOrError = Session.create({
      title: createSessionName,
      ...convertFlowAndAgentsFormToSessionProps(formValues),
      ...convertCardsFormToSessionProps(formValues),
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
    queryClient.invalidateQueries({
      queryKey: [TableName.Sessions],
    });

    // Navigate to created session page
    navigate({
      to: "/sessions/$sessionId",
      params: { sessionId: savedSession.id.toString() },
    });

    return true;
  }, [createSessionName, methods, selectSession, navigate]);

  return (
    <FormProvider {...methods}>
      <div
        className={cn(
          "absolute inset-0 z-30 mt-[var(--topbar-height)]",
          className,
        )}
      >
        <Stepper
          title="Create session"
          description={createSessionName}
          className="h-full"
          steps={[
            {
              label: "Cards",
              content: <StepCards />,
            },
            {
              label: "Flow and agent",
              content: <StepFlowAndAgents />,
            },
            {
              label: "Language & Translation",
              content: <StepLanguage />,
            },
            {
              label: "Background",
              content: <StepBackground />,
            },
            {
              label: "Message styling",
              content: (
                <StepChatStyling
                  characterCardId={
                    aiCharacterCardIds && aiCharacterCardIds.length > 0
                      ? new UniqueEntityID(aiCharacterCardIds[0])
                      : undefined
                  }
                  userCharacterCardId={
                    userCharacterCardId
                      ? new UniqueEntityID(userCharacterCardId)
                      : undefined
                  }
                />
              ),
            },
          ]}
          validation={validation}
          onCancel={() => setActivePage(Page.Init)}
          onFinish={handleFinish}
        />
      </div>
    </FormProvider>
  );
}
