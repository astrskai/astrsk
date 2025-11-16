import { useEffect, useRef } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { useSaveSession, fetchSession } from "@/entities/session/api";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { ColorPicker } from "@/shared/ui";
import { UniqueEntityID } from "@/shared/domain";

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
                    isShowValue={false}
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

  // Track last successfully saved state for error rollback
  const lastSavedStateRef = useRef<ChatStyles | undefined>(chatStyles);

  // Track if this is the initial mount to prevent auto-save on mount
  const isInitialMountRef = useRef(true);

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
      lastSavedStateRef.current = chatStyles;
    }
  }, [chatStyles, methods]);

  // Debounced save handler (500ms delay)
  const debouncedSave = useDebouncedCallback(
    async (updatedStyles: ChatStyles) => {
      try {
        const session = await fetchSession(sessionId);
        session.update({ chatStyles: updatedStyles });
        await saveSessionMutation.mutateAsync({ session });
        // Update last saved state on success
        lastSavedStateRef.current = updatedStyles;
      } catch (error) {
        toast.error("Failed to save chat styles", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        // Rollback to last successfully saved state without triggering watch
        if (lastSavedStateRef.current) {
          methods.reset(
            { chatStyles: lastSavedStateRef.current },
            { keepDefaultValues: false },
          );
        }
      }
    },
    500, // 500ms debounce
  );

  // Auto-save on form changes
  useEffect(() => {
    const subscription = methods.watch((value) => {
      // Skip auto-save on initial mount
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
      }

      // Only save if form has been touched (user made changes)
      if (value.chatStyles && methods.formState.isDirty) {
        debouncedSave(value.chatStyles);
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, debouncedSave]);

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
