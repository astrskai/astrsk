import { Import, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { BackgroundService } from "@/app/services/background-service";
import {
  fetchBackgrounds,
  useBackgroundStore,
} from "@/app/stores/background-store";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { TypoBase } from "@/components-v2/typo";
import { AspectRatio } from "@/components-v2/ui/aspect-ratio";
import { Button } from "@/components-v2/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components-v2/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { SessionProps } from "@/modules/session/domain";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";

const StepBackgroundSchema = z.object({
  backgroundId: z.string().nullable(),
});

type StepBackgroundSchemaType = z.infer<typeof StepBackgroundSchema>;

const BackgroundListItem = ({
  name = "Background",
  assetId,
  src,
  isActive,
  isEditable,
  onClick,
  onDelete,
}: {
  name?: string;
  assetId?: UniqueEntityID;
  src?: string;
  isActive?: boolean;
  isEditable?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}) => {
  const [asset] = useAsset(assetId);
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "rounded-lg relative overflow-hidden bg-background-surface-1 cursor-pointer",
        isMobile ? "w-full" : "w-[338px]",
        isActive && "ring-2 ring-primary-normal",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <AspectRatio ratio={16 / 9}>
        {src && (
          <img
            src={src}
            alt={name}
            className="object-cover pointer-events-none w-full h-full"
          />
        )}
        {asset && (
          <img
            src={asset}
            alt={name}
            className="object-cover pointer-events-none w-full h-full"
          />
        )}
      </AspectRatio>
      {isEditable && (
        <div
          className={cn(
            "absolute",
            isMobile
              ? "top-2 right-2 w-[24px] h-[24px]"
              : "inset-y-0 right-0 w-[40px] px-[8px] py-[16px] flex flex-col gap-1 bg-[#09090B]/30",
          )}
        >
          <Trash2
            className="size-[24px] text-text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          />
        </div>
      )}
    </div>
  );
};

const AddImageBackgroundItem = ({ onClick }: { onClick?: () => void }) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "rounded-lg relative overflow-hidden bg-background-input cursor-pointer transition-colors",
        isMobile ? "w-full" : "w-[338px]",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <Plus className="h-8 w-8 text-text-secondary" />
          <span className="text-sm text-text-secondary font-medium">
            Add Image
          </span>
        </div>
      </AspectRatio>
    </div>
  );
};

const StepBackground = () => {
  const { watch, setValue, trigger } =
    useFormContext<StepBackgroundSchemaType>();
  const backgroundId = watch("backgroundId");
  const isMobile = useIsMobile();

  const { defaultBackgrounds, backgrounds } = useBackgroundStore();

  // Set default background (first one) on initial mount only
  useEffect(() => {
    if (backgroundId === undefined && defaultBackgrounds.length > 0) {
      setValue("backgroundId", defaultBackgrounds[0].id.toString());
      trigger();
    }
  }, [defaultBackgrounds]); // Only run when defaultBackgrounds changes, not backgroundId

  // Handle background click
  const handleBackgroundClick = (newBackgroundId: UniqueEntityID) => {
    if (backgroundId === newBackgroundId.toString()) {
      setValue("backgroundId", null);
    } else {
      setValue("backgroundId", newBackgroundId.toString());
    }
    trigger();
  };

  // Handle add new background
  const refBackgroundFileInput = useRef<HTMLInputElement>(null);
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);
  const handleAddNewBackground = useCallback(async (file: File) => {
    // Save file to background
    const backgroundOrError =
      await BackgroundService.saveFileToBackground.execute(file);
    if (backgroundOrError.isFailure) {
      return;
    }

    // Refresh backgrounds
    fetchBackgrounds();

    // Close dialog
    setIsOpenImportDialog(false);
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

  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="w-full max-w-[600px] mx-auto px-4 flex flex-col h-full">
          <p className="text-text-body text-sm font-medium leading-tight mb-[40px] flex-shrink-0">
            Choose a background for your session: import image or select from
            the ones provided.
          </p>

          <Tabs
            defaultValue="provided"
            className="w-full flex flex-col h-full overflow-hidden"
          >
            <TabsList
              variant="mobile"
              className="grid w-full grid-cols-2 flex-shrink-0"
            >
              <TabsTrigger value="provided">astrsk provided</TabsTrigger>
              <TabsTrigger value="custom">User added</TabsTrigger>
            </TabsList>

            <TabsContent
              value="provided"
              className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col mt-[16px]"
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
              className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col mt-6"
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
    );
  }

  // Desktop layout
  return (
    <div className="x-auto px-[40px] max-w-[1200px] min-w-80 flex flex-col gap-[48px]">
      <div className="flex flex-row justify-between items-start">
        <div className="w-[720px] flex flex-col gap-[8px]">
          <div className="font-[600] text-[24px] leading-[32px] text-text-primary">
            Choose your setting
          </div>
          <div className="font-[400] text-[16px] leading-[19px] text-text-primary">
            Choose a background for your session: import image or select from
            the ones provided.
          </div>
        </div>
        <div>
          <Button size="lg" onClick={() => setIsOpenImportDialog(true)}>
            <Plus /> Add Background
          </Button>
          <Dialog
            open={isOpenImportDialog}
            onOpenChange={(open) => {
              setIsOpenImportDialog(open);
            }}
          >
            <DialogContent className="pt-14">
              <DialogTitle>Add background</DialogTitle>
              <div
                className="border-dashed bg-background-card hover:bg-background-input rounded-2xl flex flex-col justify-center items-center p-8 cursor-pointer"
                onClick={() => refBackgroundFileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  handleAddNewBackground(file);
                }}
              >
                <Import size={72} className="text-muted-foreground" />
                <div>
                  <TypoBase className="text-muted-foreground">
                    Choose a file or drag it here
                  </TypoBase>
                </div>
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
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {backgrounds.length > 0 && (
        <div className="flex flex-col gap-[16px]">
          <div className="font-[600] text-[16px] leading-[19px] text-text-primary">
            User added backgrounds
          </div>
          <div className="flex flex-wrap justify-start gap-[24px]">
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
      )}
      <div className="flex flex-col gap-[16px]">
        <div className="font-[600] text-[16px] leading-[19px] text-text-primary">
          astrsk.ai provided backgrounds
        </div>
        <div className="flex flex-wrap justify-start gap-[24px]">
          <BackgroundListItem
            isActive={!backgroundId}
            onClick={() => {
              setValue("backgroundId", null);
            }}
          />
          {defaultBackgrounds.map((defaultBackground) => (
            <BackgroundListItem
              key={defaultBackground.id.toString()}
              src={defaultBackground.src}
              isActive={backgroundId === defaultBackground.id.toString()}
              onClick={() => handleBackgroundClick(defaultBackground.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function convertBackgroundFormToSessionProps(
  values: StepBackgroundSchemaType,
): Partial<SessionProps> {
  return {
    backgroundId:
      values.backgroundId && values.backgroundId.trim() !== ""
        ? new UniqueEntityID(values.backgroundId)
        : undefined,
  };
}

export {
  AddImageBackgroundItem,
  BackgroundListItem,
  convertBackgroundFormToSessionProps,
  StepBackground,
  StepBackgroundSchema,
};
export type { StepBackgroundSchemaType };
