import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { useBackgroundStore } from "@/app/stores/background-store";
import { ColorPicker } from "@/components-v2/color-picker";
import { cn } from "@/components-v2/lib/utils";
import { StepBackgroundSchemaType } from "@/components-v2/session/create-session/step-background";
import { InlineChatStyles } from "@/components-v2/session/inline-chat-styles";
import { MessageItemInternalMobile } from "@/components-v2/session/mobile/session-messages-and-user-inputs-mobile";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { ChatStyles } from "@/modules/session/domain/chat-styles";

// Re-export schema and converter from the shared step
export { StepChatStylingSchema, convertChatStylingFormToSessionProps } from "@/components-v2/session/create-session/step-chat-styling";
export type StepChatStylingSchemaType = z.infer<typeof import("@/components-v2/session/create-session/step-chat-styling").StepChatStylingSchema>;

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

// Mobile Styling Setting Component
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

  return (
    <div
      className={cn(
        "rounded-[16px] flex flex-col gap-[16px]",
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
      <div className="flex flex-col gap-[16px] items-end">
        <div className="self-stretch justify-start text-text-primary text-base font-normal text-left">
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

// Mobile Styling Settings
export const StylingSettings = ({ className }: { className?: string }) => {
  return (
    <div className={cn("grid gap-[32px] grid-cols-2")}>
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

// Mobile Styling Preview
export const StylingPreview = ({
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
        "rounded-xl bg-background-surface-3",
        backgroundSrc && "bg-cover bg-center bg-blend-overlay bg-[#000000]/50",
        className,
      )}
      style={{
        backgroundImage: `url('${backgroundSrc}')`,
      }}
    >
      <div
        id={container}
        className="max-w-[1164px] mx-auto flex flex-col justify-center overflow-y-auto h-full py-[8px] gap-[16px]"
      >
        <InlineChatStyles container={`#${container}`} chatStyles={chatStyles} />
        <MessageItemInternalMobile
          content={testMarkdown}
          characterCardId={characterCardId}
          disabled
        />
        <MessageItemInternalMobile
          content={testMarkdown}
          characterCardId={userCharacterCardId}
          isUser 
          disabled
        />
      </div>
    </div>
  );
};

// Mobile Step Chat Styling Component
export const StepChatStylingMobile = ({
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-[16px] pb-0 flex-1 flex flex-col overflow-hidden">
        <Tabs
          defaultValue="styling"
          className="w-full flex flex-col h-full overflow-hidden"
        >
          <TabsList
            variant="mobile"
            className="grid w-full grid-cols-2 flex-shrink-0"
          >
            <TabsTrigger value="styling">Styling</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="styling" className="flex-1 overflow-y-auto mt-[16px]">
            <StylingSettings />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-[16px]">
            <p className="text-xs text-text-placeholder pb-[16px]">
              View how your changes will affect the session experience.
            </p>
            <StylingPreview
              container="step-chat-styling-preview-mobile"
              chatStyles={watch("chatStyles")}
              backgroundId={
                backgroundId ? new UniqueEntityID(backgroundId) : undefined
              }
              className="h-[calc(100%-32px)] items-center"
              characterCardId={characterCardId}
              userCharacterCardId={userCharacterCardId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};