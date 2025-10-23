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
} from "@/features/session/mobile/create-session/step-background-mobile";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/tabs";
import { Session, SessionProps } from "@/modules/session/domain";
import { useAsset } from "@/app/hooks/use-asset";
import { AspectRatio } from "@/components-v2/ui/aspect-ratio";
import { cn } from "@/shared/lib";

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
        "bg-background-surface-1 relative w-full cursor-pointer overflow-hidden rounded-lg",
        isActive && "ring-primary-normal ring-2",
      )}
    >
      <AspectRatio ratio={16 / 9}>
        {assetUrl || src ? (
          <img
            src={assetUrl || src}
            alt="Background"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-background-input flex h-full w-full items-center justify-center">
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
          className="bg-background/80 hover:bg-background absolute top-1 right-1 h-7 w-7"
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
      className="bg-background-surface-4 relative w-full cursor-pointer overflow-hidden rounded-lg transition-colors"
      onClick={onClick}
    >
      <AspectRatio ratio={16 / 9}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          <Plus className="text-muted-foreground h-6 w-6" />
          <span className="text-muted-foreground text-sm">Add Background</span>
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
      <div className="bg-background-surface-2 fixed inset-0 z-50">
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
        <div className="flex h-[calc(100%-56px)] flex-col overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-[600px] flex-col px-4 pt-4">
            <Tabs
              defaultValue={defaultTab}
              className="flex h-full w-full flex-col overflow-hidden"
            >
              <TabsList
                variant="dark-mobile"
                className="flex w-full flex-shrink-0 overflow-x-auto"
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
