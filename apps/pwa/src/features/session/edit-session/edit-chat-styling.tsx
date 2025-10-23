import { zodResolver } from "@hookform/resolvers/zod";
import { mergeWith } from "lodash-es";
import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { CustomSheet } from "@/features/session/components/custom-sheet";
import {
  convertChatStylingFormToSessionProps,
  StepChatStylingSchema,
  StepChatStylingSchemaType,
  StylingPreview,
  StylingSettings,
} from "@/features/session/mobile/create-session/step-chat-styling-mobile";
import { Button, SvgIcon, TypoLarge } from "@/shared/ui";
import {
  ChatStyles,
  defaultChatStyles,
} from "@/entities/session/domain/chat-styles";
import { SessionProps } from "@/entities/session/domain/session";

const ColorItem = ({ color }: { color?: string | null }) => {
  return (
    <span
      className="border-text-secondary inline-block h-[16px] w-[32px] rounded-full border align-middle"
      style={{
        backgroundColor: color ?? undefined,
      }}
    />
  );
};

const ColorTable = ({ chatStyles }: { chatStyles?: ChatStyles }) => {
  return (
    <div className="flex flex-row items-end">
      <div className="text-text-primary mr-[16px] flex flex-col items-end gap-[16px]">
        <div className="text-[16px] leading-[19px] font-[500]">Base</div>
        <div className="text-[16px] leading-[19px] font-[500]">Italic</div>
        <div className="text-[16px] leading-[19px] font-[500]">Bold</div>
        <div className="mt-[11px] mb-[8px] text-[16px] leading-[19px] font-[500]">
          Background
        </div>
      </div>
      <div className="mr-[12px] flex flex-col items-center">
        <div className="text-text-input-subtitle mb-[8px] text-[12px] leading-[15px] font-[500]">
          AI character
        </div>
        <div className="bg-background-surface-4 text-text-primary flex flex-row gap-[16px] rounded-[14px] px-[8px] py-[8px]">
          <div className="flex flex-col items-center gap-[17px]">
            <div className="text-[12px] leading-[15px] font-[500] whitespace-nowrap">
              Font size
            </div>
            <div className="text-[16px] leading-[19px] font-[500]">
              {chatStyles?.ai?.text?.base?.fontSize}
            </div>
            <div className="text-[16px] leading-[19px] font-[500]">
              {chatStyles?.ai?.text?.italic?.fontSize}
            </div>
            <div className="text-[16px] leading-[19px] font-[500]">
              {chatStyles?.ai?.text?.bold?.fontSize}
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            <div className="text-[12px] leading-[15px] font-[500]">Color</div>
            <ColorItem color={chatStyles?.ai?.text?.base?.color} />
            <ColorItem color={chatStyles?.ai?.text?.italic?.color} />
            <ColorItem color={chatStyles?.ai?.text?.bold?.color} />
          </div>
        </div>
        <div className="mt-[3px] self-end px-[8px] py-[8px]">
          <ColorItem color={chatStyles?.ai?.chatBubble?.backgroundColor} />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-text-input-subtitle mb-[8px] text-[12px] leading-[15px] font-[500]">
          User character
        </div>
        <div className="bg-background-surface-4 text-text-primary flex flex-row gap-[16px] rounded-[14px] px-[8px] py-[8px]">
          <div className="flex flex-col items-center gap-[17px]">
            <div className="text-[12px] leading-[15px] font-[500] whitespace-nowrap">
              Font size
            </div>
            <div className="text-[16px] leading-[19px] font-[500]">
              {chatStyles?.user?.text?.base?.fontSize}
            </div>
            <div className="text-[16px] leading-[19px] font-[500]">
              {chatStyles?.user?.text?.italic?.fontSize}
            </div>
            <div className="text-[16px] leading-[19px] font-[500]">
              {chatStyles?.user?.text?.bold?.fontSize}
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            <div className="text-[12px] leading-[15px] font-[500]">Color</div>
            <ColorItem color={chatStyles?.user?.text?.base?.color} />
            <ColorItem color={chatStyles?.user?.text?.italic?.color} />
            <ColorItem color={chatStyles?.user?.text?.bold?.color} />
          </div>
        </div>
        <div className="mt-[3px] self-end px-[8px] py-[8px]">
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
          ...convertChatStylingFormToSessionProps(
            value as StepChatStylingSchemaType,
          ),
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
