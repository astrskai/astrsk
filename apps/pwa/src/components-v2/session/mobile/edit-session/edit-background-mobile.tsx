import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";

import { BackgroundService } from "@/app/services/background-service";
import { SessionService } from "@/app/services/session-service";
import {
  fetchBackgrounds,
  useBackgroundStore,
} from "@/app/stores/background-store";
import {
  convertBackgroundFormToSessionProps,
  StepBackgroundSchema,
  StepBackgroundSchemaType,
} from "@/components-v2/session/mobile/create-session/step-background-mobile";
import { TopNavigation } from "@/components-v2/top-navigation";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { Session, SessionProps } from "@/modules/session/domain";
import { useAsset } from "@/app/hooks/use-asset";
import { AspectRatio } from "@/components-v2/ui/aspect-ratio";
import { cn } from "@/components-v2/lib/utils";

// Mobile Background List Item Component
const BackgroundListItem = ({
  src,
  assetId,
  isActive,
  isEditable,
  onClick,
  onDelete,
}: {
  src?: string;
  assetId?: UniqueEntityID;
  isActive?: boolean;
  isEditable?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}) => {
  const [assetUrl] = useAsset(assetId);

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg relative overflow-hidden bg-background-surface-1 cursor-pointer w-full",
        isActive && "ring-2 ring-primary-normal",
      )}
    >
      <AspectRatio ratio={16 / 9}>
        {assetUrl || src ? (
          <img
            src={assetUrl || src}
            alt="Background"
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="bg-background-input w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground">None</span>
          </div>
        )}
      </AspectRatio>
      {isEditable && (
        <Button
          variant="ghost_white"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Mobile Add Background Item Component
const AddImageBackgroundItem = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div
      className="rounded-lg relative overflow-hidden bg-background-surface-4 cursor-pointer transition-colors w-full"
      onClick={onClick}
    >
      <AspectRatio ratio={16 / 9}>
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          <Plus className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Add Background</span>
        </div>
      </AspectRatio>
    </div>
  );
};

interface EditBackgroundMobileProps {
  session: Session;
  onSave: (props: Partial<SessionProps>) => Promise<void>;
  onBack: () => void;
}

export function EditBackgroundMobile({
  session,
  onSave,
  onBack,
}: EditBackgroundMobileProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Handle Android back gesture
  // useBackGesture({ onBack });

  // Use form
  const methods = useForm<StepBackgroundSchemaType>({
    resolver: zodResolver(StepBackgroundSchema),
    defaultValues: {
      backgroundId: session.props.backgroundId?.toString(),
    },
  });
  const { watch, setValue, getValues } = methods;
  const backgroundId = watch("backgroundId");

  // Background list
  const { defaultBackgrounds, backgrounds } = useBackgroundStore();

  // Determine default tab based on current background
  const isUserBackground =
    backgroundId && backgrounds.some((bg) => bg.id.toString() === backgroundId);
  const defaultTab = isUserBackground ? "custom" : "provided";

  // Handle background click
  const handleBackgroundClick = useCallback(
    async (newBackgroundId: UniqueEntityID) => {
      // Set form value
      if (backgroundId === newBackgroundId.toString()) {
        setValue("backgroundId", null);
      } else {
        setValue("backgroundId", newBackgroundId.toString());
      }
    },
    [backgroundId, setValue],
  );

  // Handle add new background
  const refBackgroundFileInput = useRef<HTMLInputElement>(null);
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

  // Handle delete background
  const handleDeleteBackground = useCallback(
    async (backgroundId: UniqueEntityID) => {
      const backgroundOrError =
        await BackgroundService.deleteBackground.execute(backgroundId);
      if (backgroundOrError.isFailure) {
        return;
      }

      // Refresh backgrounds
      fetchBackgrounds();
    },
    [],
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formValues = getValues();
      const sessionProps = convertBackgroundFormToSessionProps(formValues);

      await onSave(sessionProps);
      toast.success("Background updated");
      onBack();
    } catch (error) {
      // Error handling is done in updateSession
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="fixed inset-0 z-50 bg-background-surface-2">
        {/* Header */}
        <TopNavigation
          title="Background"
          leftAction={
            <Button
              variant="ghost_white"
              size="icon"
              onClick={onBack}
              className="h-[40px] w-[40px] p-[8px]"
            >
              <ChevronLeft className="min-h-6 min-w-6" />
            </Button>
          }
          rightAction={
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="ghost"
              className="h-[40px]"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          }
        />

        {/* Content - Mobile layout from StepBackground */}
        <div className="h-[calc(100%-56px)] flex flex-col overflow-hidden">
          <div className="w-full max-w-[600px] mx-auto px-4 pt-4 flex flex-col h-full">
            <Tabs
              defaultValue={defaultTab}
              className="w-full flex flex-col h-full overflow-hidden"
            >
              <TabsList
                variant="dark-mobile"
                className="flex w-full overflow-x-auto flex-shrink-0"
              >
                <TabsTrigger value="provided">astrsk provided</TabsTrigger>
                <TabsTrigger value="custom">User added</TabsTrigger>
              </TabsList>

              <TabsContent
                value="provided"
                className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ScrollArea className="flex-1">
                  <div className="p-[2px]">
                    <div className="grid grid-cols-2 gap-[8px]">
                      {defaultBackgrounds.map((defaultBackground) => (
                        <BackgroundListItem
                          key={defaultBackground.id.toString()}
                          src={defaultBackground.src}
                          isActive={
                            backgroundId === defaultBackground.id.toString()
                          }
                          onClick={() =>
                            handleBackgroundClick(defaultBackground.id)
                          }
                        />
                      ))}
                      <BackgroundListItem
                        isActive={!backgroundId}
                        onClick={() => {
                          setValue("backgroundId", null);
                        }}
                      />
                    </div>
                  </div>
                  <ScrollBar orientation="vertical" className="w-0" />
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="custom"
                className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ScrollArea className="flex-1">
                  <div className="p-[2px]">
                    <div className="grid grid-cols-2 gap-[8px]">
                      <AddImageBackgroundItem
                        onClick={() => refBackgroundFileInput.current?.click()}
                      />
                      {backgrounds.map((background) => (
                        <BackgroundListItem
                          key={background.id.toString()}
                          assetId={background.assetId}
                          isEditable
                          isActive={backgroundId === background.id.toString()}
                          onClick={() => handleBackgroundClick(background.id)}
                          onDelete={() => handleDeleteBackground(background.id)}
                        />
                      ))}
                    </div>
                  </div>
                  <ScrollBar orientation="vertical" className="w-0" />
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Hidden file input for mobile direct access */}
            <input
              ref={refBackgroundFileInput}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) {
                  return;
                }
                const file = e.target.files[0];
                handleAddNewBackground(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
