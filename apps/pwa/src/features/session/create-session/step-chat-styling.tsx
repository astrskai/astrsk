import { mergeWith } from "lodash-es";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { useBackgroundStore } from "@/app/stores/background-store";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/shared/lib/cn";
import { StepBackgroundSchemaType } from "@/features/session/create-session/step-background";
import { InlineChatStyles } from "@/features/session/inline-chat-styles";
import { MessageItemInternal } from "@/features/session/session-messages-and-user-inputs";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  ChatStyles,
  defaultChatStyles,
} from "@/modules/session/domain/chat-styles";
import { SessionProps } from "@/modules/session/domain/session";

const ChatStyleSchema = z.object({
  // Font
  text: z
    .object({
      base: z
        .object({
          fontSize: z.number().nullish(),
          color: z.string().nullish(),
        })
        .nullish(),
      italic: z
        .object({
          fontSize: z.number().nullish(),
          color: z.string().nullish(),
        })
        .nullish(),
      bold: z
        .object({
          fontSize: z.number().nullish(),
          color: z.string().nullish(),
        })
        .nullish(),
    })
    .nullish(),

  // Chat bubble
  chatBubble: z
    .object({
      backgroundColor: z.string().nullish(),
    })
    .nullish(),
});

const StepChatStylingSchema = z.object({
  chatStyles: z.object({
    user: ChatStyleSchema.nullish(),
    ai: ChatStyleSchema.nullish(),
  }),
});

type StepChatStylingSchemaType = z.infer<typeof StepChatStylingSchema>;

const valueAsInt = (value: any) => {
  const parsedValue = parseInt(value);
  return isNaN(parsedValue) ? null : parsedValue;
};

// Ignore non-integer key
const nonIntegerKeys = ["e", "E", "+", "-", "."];
const ignoreNonIntegerKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const { key } = e;
  if (nonIntegerKeys.includes(key)) {
    e.preventDefault();
  }
};

const StylingSetting = ({
  title,
  field,
  className,
}: {
  title: string;
  field: "chatStyles.user" | "chatStyles.ai";
  className?: string;
}) => {
  const { control, register } = useFormContext<StepChatStylingSchemaType>();
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "flex flex-col rounded-[16px] p-[16px]",
        isMobile
          ? "gap-[16px]"
          : "border-background-surface-3 gap-[24px] border",
        className,
      )}
    >
      <div className="text-text-primary justify-start self-stretch text-base leading-relaxed font-semibold">
        {title}
      </div>
      <div className="flex flex-col gap-[8px]">
        <div className="text-text-primary justify-start self-stretch text-base font-normal">
          Base font
        </div>
        <div className="flex flex-row gap-[8px]">
          <div className="grow">
            <FloatingLabelInput
              className="h-[62px]"
              label="Font size"
              type="number"
              step={1}
              min={0}
              max={100}
              onKeyDown={ignoreNonIntegerKey}
              {...register(`${field}.text.base.fontSize`, {
                setValueAs: valueAsInt,
              })}
            />
          </div>
          <Controller
            control={control}
            name={`${field}.text.base.color`}
            render={({ field: { onChange, value } }) => (
              <ColorPicker
                value={value ?? ""}
                onChange={(newValue) => {
                  onChange(newValue);
                }}
              />
            )}
          />
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <div className="text-text-primary justify-start self-stretch text-base font-normal">
          Italic font
        </div>
        <div className="flex flex-row gap-[8px]">
          <div className="grow">
            <FloatingLabelInput
              className="h-[62px]"
              label="Font size"
              type="number"
              step={1}
              min={0}
              max={100}
              onKeyDown={ignoreNonIntegerKey}
              {...register(`${field}.text.italic.fontSize`, {
                setValueAs: valueAsInt,
              })}
            />
          </div>
          <Controller
            control={control}
            name={`${field}.text.italic.color`}
            render={({ field: { onChange, value } }) => (
              <ColorPicker
                value={value ?? ""}
                onChange={(newValue) => {
                  onChange(newValue);
                }}
              />
            )}
          />
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <div className="text-text-primary justify-start self-stretch text-base font-normal">
          Bold font
        </div>
        <div className="flex flex-row gap-[8px]">
          <div className="grow">
            <FloatingLabelInput
              className="h-[62px]"
              label="Font size"
              type="number"
              step={1}
              min={0}
              max={100}
              onKeyDown={ignoreNonIntegerKey}
              {...register(`${field}.text.bold.fontSize`, {
                setValueAs: valueAsInt,
              })}
            />
          </div>
          <Controller
            control={control}
            name={`${field}.text.bold.color`}
            render={({ field: { onChange, value } }) => (
              <ColorPicker
                value={value ?? ""}
                onChange={(newValue) => {
                  onChange(newValue);
                }}
              />
            )}
          />
        </div>
      </div>
      <div className="flex flex-row items-center gap-[16px]">
        <div
          className={cn(
            "text-text-primary grow font-[400]",
            isMobile
              ? "text-[14px] leading-[17px]"
              : "text-[16px] leading-[19px]",
          )}
        >
          Background color
        </div>
        <Controller
          control={control}
          name={`${field}.chatBubble.backgroundColor`}
          render={({ field: { onChange, value } }) => (
            <ColorPicker
              value={value ?? ""}
              onChange={(newValue) => {
                onChange(newValue);
              }}
            />
          )}
        />
      </div>
    </div>
  );
};

const StylingSettings = ({ className }: { className?: string }) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("grid gap-4", isMobile ? "grid-cols-2" : "grid-cols-2")}>
      <StylingSetting
        title="AI message"
        field="chatStyles.ai"
        className={className}
      />
      <StylingSetting
        title="User message"
        field="chatStyles.user"
        className={className}
      />
    </div>
  );
};

const testMarkdown = `
- This is normal text. This is normal text.
- *This is italic text. This is italic text.*
- **This is bold text. This is bold text.**
`;

const StylingPreview = ({
  container,
  chatStyles,
  backgroundId,
  className,
  characterCardId,
  userCharacterCardId,
}: {
  container: string;
  chatStyles?: ChatStyles;
  backgroundId?: UniqueEntityID;
  className?: string;
  characterCardId?: UniqueEntityID;
  userCharacterCardId?: UniqueEntityID;
}) => {
  const isMobile = useIsMobile();

  // Background
  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(backgroundId?.toString() ?? "");
  const [backgroundAsset] = useAsset(background?.assetId);
  const backgroundSrc =
    backgroundAsset ??
    (background && "src" in background ? background.src : "");

  return (
    <div
      className={cn(
        "bg-background-screen rounded-xl",
        backgroundSrc && "bg-[#000000]/50 bg-cover bg-center bg-blend-overlay",
        isMobile ? "bg-background-surface-3" : "",
        className,
      )}
      style={{
        backgroundImage: `url('${backgroundSrc}')`,
      }}
    >
      <div
        id={container}
        className={cn(
          "mx-auto flex max-w-[1164px] flex-col justify-center overflow-y-auto",
          isMobile
            ? "h-full gap-[16px] py-[8px]"
            : "h-[calc(100%-120px)] gap-[40px] py-[40px]",
        )}
      >
        <InlineChatStyles container={`#${container}`} chatStyles={chatStyles} />
        <MessageItemInternal
          content={testMarkdown}
          characterCardId={characterCardId}
          disabled
        />
        <MessageItemInternal
          content={testMarkdown}
          characterCardId={userCharacterCardId}
          isUser
          disabled
        />
      </div>
    </div>
  );
};

const StepChatStyling = ({
  characterCardId,
  userCharacterCardId,
}: {
  characterCardId?: UniqueEntityID;
  userCharacterCardId?: UniqueEntityID;
}) => {
  const { watch } = useFormContext<
    StepChatStylingSchemaType & StepBackgroundSchemaType
  >();
  const backgroundId = watch("backgroundId");
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mx-auto h-[calc(100%-3.5rem)] w-full max-w-[600px] px-4">
        {/* <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-text-primary mb-2">
            Message styling
          </h2>
          <p className="text-text-input-subtitle">
            Customize the appearance of messages in your session.
          </p>
        </div> */}

        <Tabs
          defaultValue="settings"
          className="flex h-full w-full flex-col overflow-hidden"
        >
          <TabsList
            variant="dark-mobile"
            className="grid w-full flex-shrink-0 grid-cols-2"
          >
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <StylingSettings />
          </TabsContent>

          <TabsContent value="preview" className="h-[calc(100%-120px)]">
            <p className="text-text-placeholder pb-[16px] text-xs">
              View how your changes will affect the session experience.
            </p>
            <StylingPreview
              container="step-chat-styling-preview-mobile"
              chatStyles={watch("chatStyles")}
              backgroundId={
                backgroundId ? new UniqueEntityID(backgroundId) : undefined
              }
              className="h-full items-center"
              characterCardId={characterCardId}
              userCharacterCardId={userCharacterCardId}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex w-full max-w-[1526px] min-w-80 flex-row justify-center gap-[40px] px-[40px]">
      <div
        className={cn(
          "flex max-w-[646px] min-w-[400px] flex-col gap-[32px] rounded-[16px] px-[20px] py-[24px] xl:w-[45%]",
          "bg-background-surface-3",
        )}
      >
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-col gap-[8px]">
            <div className="text-text-primary text-[20px] leading-[32px] font-[500]">
              Message styling
            </div>
            <div className="text-text-primary text-[16px] leading-[19px] font-[400]">
              Set the stage
            </div>
          </div>
        </div>
        <StylingSettings />
      </div>
      <div className="bg-background-surface-3 h-full max-w-[760px] min-w-[400px] overflow-hidden rounded-[16px] xl:w-[55%]">
        <div className="px-[16px] py-[24px]">
          <div className="flex flex-col gap-[8px]">
            <div className="text-text-primary text-[20px] leading-[32px] font-[500]">
              Styling preview
            </div>
            <div className="text-text-primary text-[16px] leading-[19px] font-[400]">
              View how your changes will affect the session experience.
            </div>
          </div>
        </div>
        <StylingPreview
          container="step-chat-styling-preview"
          chatStyles={watch("chatStyles")}
          backgroundId={
            backgroundId ? new UniqueEntityID(backgroundId) : undefined
          }
          className="h-full items-center rounded-none"
          characterCardId={characterCardId}
          userCharacterCardId={userCharacterCardId}
        />
      </div>
    </div>
  );
};

function convertChatStylingFormToSessionProps(
  values: StepChatStylingSchemaType,
): Partial<SessionProps> {
  // Merge with default chat styles
  const mergedValue = mergeWith(
    {},
    { chatStyles: defaultChatStyles },
    values,
    (value: any, srcValue: any) => (srcValue === null ? value : undefined),
  );

  // Return merged value
  return mergedValue;
}

export {
  convertChatStylingFormToSessionProps,
  StepChatStyling,
  StepChatStylingSchema,
  StylingPreview,
  StylingSettings,
};
export type { StepChatStylingSchemaType };
