import { useEffect, useRef } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { toastError } from "@/shared/ui/toast";
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
    { label: "Base", field: "base" },
    { label: "Bold", field: "bold" },
    { label: "Italic", field: "italic" },
    { label: "BG", field: "background" },
  ];

  return (
    <div>
      <h4 className="text-fg-subtle mb-4 text-sm font-medium flex justify-center">{title}</h4>
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
              className="flex flex-col items-center gap-1.5 py-1"
            >
              <Controller
                name={fieldName}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker
                    value={value ?? ""}
                    onChange={(newValue) => {
                      onChange(newValue);
                    }}
                    className="[&>div:first-child]:border [&>div:first-child]:border-border-muted [&>div:first-child]:h-8 [&>div:first-child]:w-12 [&>div:first-child]:rounded-full"
                    orientation="horizontal"
                    isShowValue={false}
                  />
                )}
              />
              <p className="text-fg-subtle text-xs">{item.label}</p>
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

  // Track programmatic resets to prevent autosave loops
  const isProgrammaticResetRef = useRef(false);

  // Use react-hook-form for state management
  const methods = useForm<MessageStylingFormData>({
    defaultValues: {
      chatStyles: chatStyles ?? {},
    },
  });

  // Sync form state with prop changes
  useEffect(() => {
    if (chatStyles) {
      isProgrammaticResetRef.current = true;
      methods.reset({ chatStyles });
      lastSavedStateRef.current = chatStyles;
      isProgrammaticResetRef.current = false;
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
        toastError("Failed to save chat styles", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        // Rollback to last successfully saved state without triggering watch
        if (lastSavedStateRef.current) {
          isProgrammaticResetRef.current = true;
          methods.reset(
            { chatStyles: lastSavedStateRef.current },
            { keepDefaultValues: false },
          );
          isProgrammaticResetRef.current = false;
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

      // Skip auto-save on programmatic reset
      if (isProgrammaticResetRef.current) {
        return;
      }

      // Save if chatStyles value exists (removed isDirty check)
      if (value.chatStyles) {
        debouncedSave(value.chatStyles);
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, debouncedSave]);

  return (
    <FormProvider {...methods}>
      <div className="grid grid-cols-2 gap-4">
        <ColorGrid userType="ai" title="AI message" chatStyles={chatStyles} />
        <ColorGrid
          userType="user"
          title="User message"
          chatStyles={chatStyles}
        />
      </div>
    </FormProvider>
  );
}
