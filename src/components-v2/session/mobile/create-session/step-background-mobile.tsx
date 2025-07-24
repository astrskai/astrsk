import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { BackgroundService } from "@/app/services/background-service";
import {
  fetchBackgrounds,
  useBackgroundStore,
} from "@/app/stores/background-store";
import { cn } from "@/components-v2/lib/utils";
import { TypoBase } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components-v2/ui/tabs";
import { AspectRatio } from "@/components-v2/ui/aspect-ratio";
import { Background } from "@/modules/background/domain";

// Re-export schema and converter from the shared step
export { StepBackgroundSchema, convertBackgroundFormToSessionProps } from "@/components-v2/session/create-session/step-background";

export type StepBackgroundSchemaType = z.infer<typeof import("@/components-v2/session/create-session/step-background").StepBackgroundSchema>;

// Mobile Background List Item
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
  const [asset] = useAsset(assetId);

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg relative overflow-hidden bg-background-surface-1 cursor-pointer w-full",
        isActive && "ring-2 ring-primary-normal",
      )}
    >
      <AspectRatio ratio={16 / 9}>
        {(src || asset) ? (
          <img
            src={src || asset!}
            alt="Background"
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="bg-background-input w-full h-full flex items-center justify-center">
            <TypoBase className="text-muted-foreground">No background</TypoBase>
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

// Mobile Add Background Item
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

// Mobile Step Background Component
export const StepBackgroundMobile = ({
  handleAddNewBackground,
}: {
  handleAddNewBackground: (file: File) => void;
}) => {
  const refBackgroundFileInput = useRef<HTMLInputElement>(null);
  const { setValue, watch } = useFormContext<StepBackgroundSchemaType>();
  const backgroundId = watch("backgroundId");

  const { defaultBackgrounds, backgrounds } = useBackgroundStore();

  // Set first background as default if no background is selected
  useEffect(() => {
    if (!backgroundId && defaultBackgrounds.length > 0) {
      setValue("backgroundId", defaultBackgrounds[0].id.toString());
    }
  }, [backgroundId, defaultBackgrounds, setValue]);

  const handleBackgroundClick = (id: UniqueEntityID) => {
    setValue("backgroundId", id.toString());
  };

  const handleDeleteBackground = async (id: UniqueEntityID) => {
    const backgroundOrError = await BackgroundService.deleteBackground.execute(id);
    if (backgroundOrError.isFailure) {
      return;
    }

    // Refresh backgrounds
    fetchBackgrounds();
    
    // Clear selection if deleted background was selected
    if (backgroundId === id.toString()) {
      setValue("backgroundId", null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-[16px] pb-0 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col gap-[24px]">
          <div className="text-text-body text-sm font-medium leading-tight">
            Choose a background for your session: import image or select from the ones provided.
          </div>
        </div>
        <Tabs
          defaultValue="provided"
          className="w-full flex flex-col h-full overflow-hidden mt-[24px]"
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
                      isActive={backgroundId === defaultBackground.id.toString()}
                      onClick={() => handleBackgroundClick(defaultBackground.id)}
                    />
                  ))}
                  <BackgroundListItem
                    isActive={!backgroundId}
                    onClick={() => setValue("backgroundId", null)}
                  />
                </div>
              </div>
              <ScrollBar orientation="vertical" className="w-0" />
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="custom"
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col mt-[16px]"
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
};