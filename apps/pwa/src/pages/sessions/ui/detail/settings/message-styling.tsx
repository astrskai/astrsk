import { useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { ColorPicker } from "@/shared/ui";
import { UniqueEntityID } from "@/shared/domain";
import { useSaveSession, fetchSession } from "@/entities/session/api";

interface MessageStylingProps {
  sessionId: UniqueEntityID;
  chatStyles?: ChatStyles;
}

interface MessageStylingFormData {
  chatStyles: ChatStyles;
}

// Helper to get field name for react-hook-form
const getFieldName = (
  userType: "ai" | "user",
  field: "base" | "bold" | "italic" | "background",
): `chatStyles.${string}` => {
  if (field === "background") {
    return `chatStyles.${userType}.chatBubble.backgroundColor`;
  }
  return `chatStyles.${userType}.text.${field}.color`;
};

const ColorGrid = ({
  userType,
  title,
  chatStyles,
}: {
  userType: "ai" | "user";
  title: string;
  chatStyles?: ChatStyles;
}) => {
  const fields: Array<{
    label: string;
    field: "base" | "bold" | "italic" | "background";
  }> = [
    { label: "Base text", field: "base" },
    { label: "Bold text", field: "bold" },
    { label: "Italic text", field: "italic" },
    { label: "Background", field: "background" },
  ];

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-gray-300">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((item) => {
          const fieldName = getFieldName(userType, item.field);
          const currentValue =
            item.field === "background"
              ? chatStyles?.[userType]?.chatBubble?.backgroundColor
              : chatStyles?.[userType]?.text?.[item.field]?.color;

          // Skip if no color value
          if (!currentValue) return null;

          return (
            <div
              key={item.field}
              className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 p-2"
            >
              <Controller
                name={fieldName}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker
                    value={value ?? ""}
                    onChange={(newValue) => {
                      onChange(newValue);
                    }}
                    className="[&>div]:first:border-1 [&>div]:first:border-gray-700"
                    orientation="horizontal"
                  />
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-400">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function MessageStyling({
  sessionId,
  chatStyles,
}: MessageStylingProps) {
  const saveSessionMutation = useSaveSession();

  // Use react-hook-form for state management
  const methods = useForm<MessageStylingFormData>({
    defaultValues: {
      chatStyles: chatStyles ?? {},
    },
  });

  // Sync form state with prop changes
  useEffect(() => {
    if (chatStyles) {
      methods.reset({ chatStyles });
    }
  }, [chatStyles, methods]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = methods.watch(async (value) => {
      if (value.chatStyles) {
        try {
          const session = await fetchSession(sessionId);
          session.update({ chatStyles: value.chatStyles });
          await saveSessionMutation.mutateAsync({ session });
        } catch (error) {
          console.error("Failed to save chat styles:", error);
          // Rollback on error
          methods.reset({ chatStyles });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, sessionId, saveSessionMutation, chatStyles]);

  return (
    <FormProvider {...methods}>
      <div className="space-y-4">
        <ColorGrid userType="ai" title="AI Message" chatStyles={chatStyles} />
        <ColorGrid
          userType="user"
          title="User Message"
          chatStyles={chatStyles}
        />
      </div>
    </FormProvider>
  );
}
