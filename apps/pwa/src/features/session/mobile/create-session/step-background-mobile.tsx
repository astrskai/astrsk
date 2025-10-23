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
import { TypoBase } from "@/components/ui/typo";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { AspectRatio } from "@/components-v2/ui/aspect-ratio";
import { Background } from "@/modules/background/domain";

// Re-export schema and converter from the shared step
export {
  StepBackgroundSchema,
  convertBackgroundFormToSessionProps,
} from "@/features/session/create-session/step-background";

export type StepBackgroundSchemaType = z.infer<
  typeof import("@/features/session/create-session/step-background").StepBackgroundSchema
>;

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
        "bg-background-surface-1 relative w-full cursor-pointer overflow-hidden rounded-lg",
        isActive && "ring-primary-normal ring-2",
      )}
    >
      <AspectRatio ratio={16 / 9}>
        {src || asset ? (
          <img
            src={src || asset!}
            alt="Background"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-background-input flex h-full w-full items-center justify-center">
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
          className="bg-background/80 hover:bg-background absolute top-1 right-1 h-7 w-7"
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
    const backgroundOrError =
      await BackgroundService.deleteBackground.execute(id);
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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden p-[16px] pb-0">
        <div className="flex flex-col gap-[24px]">
          <div className="text-text-body text-sm leading-tight font-medium">
            Choose a background for your session: import image or select from
            the ones provided.
          </div>
        </div>
        <Tabs
          defaultValue="provided"
          className="mt-[24px] flex h-full w-full flex-col overflow-hidden"
        >
          <TabsList
            variant="mobile"
            className="grid w-full flex-shrink-0 grid-cols-2"
          >
            <TabsTrigger value="provided">astrsk provided</TabsTrigger>
            <TabsTrigger value="custom">User added</TabsTrigger>
          </TabsList>

          <TabsContent
            value="provided"
            className="mt-[16px] flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
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
                    onClick={() => setValue("backgroundId", null)}
                  />
                </div>
              </div>
              <ScrollBar orientation="vertical" className="w-0" />
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="custom"
            className="mt-[16px] flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
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
