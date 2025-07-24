import { zodResolver } from "@hookform/resolvers/zod";
import { mergeWith } from "lodash-es";
import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { CustomSheet } from "@/components-v2/custom-sheet";
import {
  convertChatStylingFormToSessionProps,
  StepChatStylingSchema,
  StepChatStylingSchemaType,
  StylingPreview,
  StylingSettings,
} from "@/components-v2/session/mobile/create-session/step-chat-styling-mobile";
import { SvgIcon } from "@/components-v2/svg-icon";
import { TypoLarge } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import {
  ChatStyles,
  defaultChatStyles,
} from "@/modules/session/domain/chat-styles";
import { SessionProps } from "@/modules/session/domain/session";

const ColorItem = ({ color }: { color?: string | null }) => {
  return (
    <span
      className="inline-block w-[32px] h-[16px] rounded-full border border-text-secondary align-middle"
      style={{
        backgroundColor: color ?? undefined,
      }}
    />
  );
};

const ColorTable = ({ chatStyles }: { chatStyles?: ChatStyles }) => {
  return (
    <div className="flex flex-row items-end">
      <div className="mr-[16px] flex flex-col gap-[16px] items-end text-text-primary">
        <div className="font-[500] text-[16px] leading-[19px]">Base</div>
        <div className="font-[500] text-[16px] leading-[19px]">Italic</div>
        <div className="font-[500] text-[16px] leading-[19px]">Bold</div>
        <div className="font-[500] text-[16px] leading-[19px] mt-[11px] mb-[8px]">
          Background
        </div>
      </div>
      <div className="flex flex-col items-center mr-[12px]">
        <div className="mb-[8px] font-[500] text-[12px] leading-[15px] text-text-input-subtitle">
          AI character
        </div>
        <div className="px-[8px] py-[8px] bg-background-surface-4 rounded-[14px] flex flex-row gap-[16px] text-text-primary">
          <div className="flex flex-col gap-[17px] items-center">
            <div className="font-[500] text-[12px] leading-[15px] whitespace-nowrap">
              Font size
            </div>
            <div className="font-[500] text-[16px] leading-[19px]">
              {chatStyles?.ai?.text?.base?.fontSize}
            </div>
            <div className="font-[500] text-[16px] leading-[19px]">
              {chatStyles?.ai?.text?.italic?.fontSize}
            </div>
            <div className="font-[500] text-[16px] leading-[19px]">
              {chatStyles?.ai?.text?.bold?.fontSize}
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            <div className="font-[500] text-[12px] leading-[15px]">Color</div>
            <ColorItem color={chatStyles?.ai?.text?.base?.color} />
            <ColorItem color={chatStyles?.ai?.text?.italic?.color} />
            <ColorItem color={chatStyles?.ai?.text?.bold?.color} />
          </div>
        </div>
        <div className="self-end mt-[3px] px-[8px] py-[8px]">
          <ColorItem color={chatStyles?.ai?.chatBubble?.backgroundColor} />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="mb-[8px] font-[500] text-[12px] leading-[15px] text-text-input-subtitle">
          User character
        </div>
        <div className="px-[8px] py-[8px] bg-background-surface-4 rounded-[14px] flex flex-row gap-[16px] text-text-primary">
          <div className="flex flex-col gap-[17px] items-center">
            <div className="font-[500] text-[12px] leading-[15px] whitespace-nowrap">
              Font size
            </div>
            <div className="font-[500] text-[16px] leading-[19px]">
              {chatStyles?.user?.text?.base?.fontSize}
            </div>
            <div className="font-[500] text-[16px] leading-[19px]">
              {chatStyles?.user?.text?.italic?.fontSize}
            </div>
            <div className="font-[500] text-[16px] leading-[19px]">
              {chatStyles?.user?.text?.bold?.fontSize}
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            <div className="font-[500] text-[12px] leading-[15px]">Color</div>
            <ColorItem color={chatStyles?.user?.text?.base?.color} />
            <ColorItem color={chatStyles?.user?.text?.italic?.color} />
            <ColorItem color={chatStyles?.user?.text?.bold?.color} />
          </div>
        </div>
        <div className="self-end mt-[3px] px-[8px] py-[8px]">
          <ColorItem color={chatStyles?.user?.chatBubble?.backgroundColor} />
        </div>
      </div>
    </div>
  );
};

const EditChatStyling = ({
  container,
  defaultValue,
  onSave,
  trigger,
  backgroundId,
  characterCardId,
  userCharacterCardId,
}: {
  container: string;
  defaultValue: { chatStyles: ChatStyles };
  onSave: (newValue: Partial<SessionProps>) => Promise<void>;
  trigger?: React.ReactNode;
  backgroundId?: UniqueEntityID;
  characterCardId?: UniqueEntityID;
  userCharacterCardId?: UniqueEntityID;
}) => {
  // Use form
  const methods = useForm<StepChatStylingSchemaType>({
    resolver: zodResolver(StepChatStylingSchema),
  });

  // Auto-save on form changes
  useEffect(() => {
    const subscription = methods.watch(async (value) => {
      if (value.chatStyles) {
        await onSave({
          ...convertChatStylingFormToSessionProps(value as StepChatStylingSchemaType),
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, onSave]);

  return (
    <CustomSheet
      title="Message styling"
      trigger={trigger ?? <SvgIcon name="edit" size={24} />}
      onOpenChange={(open) => {
        if (open) {
          const mergedValue = mergeWith(
            {},
            { chatStyles: defaultChatStyles },
            defaultValue,
            (value: any, srcValue: any) =>
              srcValue === null ? value : undefined,
          );
          methods.reset(mergedValue);
        }
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <TypoLarge>Size and color</TypoLarge>
          <FormProvider {...methods}>
            <StylingSettings className="bg-background-surface-2" />
          </FormProvider>
        </div>
        <div className="flex flex-col gap-4">
          <TypoLarge>Preview</TypoLarge>
          <div className="bg-primary/10 rounded-xl">
            <StylingPreview
              container={`preview-${container}`}
              chatStyles={methods.watch("chatStyles")}
              backgroundId={backgroundId}
              characterCardId={characterCardId}
              userCharacterCardId={userCharacterCardId}
            />
          </div>
        </div>
      </div>
    </CustomSheet>
  );
};

export { ColorTable, EditChatStyling };
