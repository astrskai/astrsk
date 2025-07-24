import { mergeWith } from "lodash-es";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { useBackgroundStore } from "@/app/stores/background-store";
import { ColorPicker } from "@/components-v2/color-picker";
import { cn } from "@/components-v2/lib/utils";
import { StepBackgroundSchemaType } from "@/components-v2/session/create-session/step-background";
import { InlineChatStyles } from "@/components-v2/session/inline-chat-styles";
import {
  MessageItemInternal,
} from "@/components-v2/session/session-messages-and-user-inputs";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import {
  ChatStyles,
  defaultChatStyles,
} from "@/modules/session/domain/chat-styles";
import { SessionProps } from "@/modules/session/domain/session";
import { isMobileSafari } from "react-device-detect";

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
        "p-[16px] rounded-[16px] flex flex-col",
        isMobile
          ? "gap-[16px]"
          : "gap-[24px] border border-background-surface-3",
        className,
      )}
    >
      <div className="self-stretch justify-start text-text-primary text-base font-semibold leading-relaxed">
        {title}
      </div>
      <div className="flex flex-col gap-[8px]">
        <div className="self-stretch justify-start text-text-primary text-base font-normal">
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
        <div className="self-stretch justify-start text-text-primary text-base font-normal">
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
        <div className="self-stretch justify-start text-text-primary text-base font-normal">
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
      <div className="flex flex-row gap-[16px] items-center">
        <div
          className={cn(
            "grow font-[400] text-text-primary",
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
        "rounded-xl bg-background-screen",
        backgroundSrc && "bg-cover bg-center bg-blend-overlay bg-[#000000]/50",
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
          "max-w-[1164px] mx-auto flex flex-col justify-center overflow-y-auto",
          isMobile
            ? "h-full py-[8px] gap-[16px]"
            : "h-[calc(100%-120px)] py-[40px] gap-[40px]",
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
      <div className="w-full h-[calc(100%-3.5rem)] max-w-[600px] mx-auto px-4">
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
          className="w-full flex flex-col h-full overflow-hidden"
        >
          <TabsList
            variant="dark-mobile"
            className="grid w-full grid-cols-2 flex-shrink-0"
          >
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <StylingSettings />
          </TabsContent>

          <TabsContent value="preview" className="h-[calc(100%-120px)]">
            <p className="text-xs text-text-placeholder pb-[16px]">
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
    <div className="w-full flex flex-row max-w-[1526px] min-w-80 px-[40px] gap-[40px] justify-center">
      <div
        className={cn(
          "xl:w-[45%] min-w-[400px] max-w-[646px] px-[20px] py-[24px] rounded-[16px] flex flex-col gap-[32px]",
          "bg-background-surface-3",
        )}
      >
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-col gap-[8px]">
            <div className="font-[500] text-[20px] leading-[32px] text-text-primary">
              Message styling
            </div>
            <div className="font-[400] text-[16px] leading-[19px] text-text-primary">
              Set the stage
            </div>
          </div>
        </div>
        <StylingSettings />
      </div>
      <div className="xl:w-[55%] h-full min-w-[400px] max-w-[760px] rounded-[16px] bg-background-surface-3 overflow-hidden">
        <div className="px-[16px] py-[24px]">
          <div className="flex flex-col gap-[8px]">
            <div className="font-[500] text-[20px] leading-[32px] text-text-primary">
              Styling preview
            </div>
            <div className="font-[400] text-[16px] leading-[19px] text-text-primary">
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
          className="rounded-none h-full items-center"
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
