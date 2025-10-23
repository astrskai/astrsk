import { zodResolver } from "@hookform/resolvers/zod";
import { Import, Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { BackgroundService } from "@/app/services/background-service";
import {
  fetchBackgrounds,
  isDefaultBackground,
  useBackgroundStore,
} from "@/app/stores/background-store";
import { CustomSheet } from "@/features/session/components/custom-sheet";
import {
  BackgroundListItem,
  convertBackgroundFormToSessionProps,
  StepBackgroundSchema,
  StepBackgroundSchemaType,
} from "@/features/session/create-session/step-background";
import { SvgIcon } from "@/components/ui/svg-icon";
import { TypoBase, TypoLarge } from "@/components/ui/typo";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components-v2/ui/dialog";
import { SessionProps } from "@/modules/session/domain/session";

const SelectedBackground = ({
  backgroundId,
}: {
  backgroundId?: UniqueEntityID;
}) => {
  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(backgroundId?.toString() ?? "");
  const [asset] = useAsset(background?.assetId);

  return (
    <div className="bg-background-screen h-[198px] overflow-hidden rounded-[14px]">
      {background && isDefaultBackground(background) ? (
        <div style={{ height: "198px", position: "relative" }}>
          <img
            src={background.src}
            alt={background.name ?? "Background"}
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>
      ) : (
        asset && (
          <div style={{ height: "198px", position: "relative" }}>
            <img
              src={asset}
              alt={background?.name ?? "Background"}
              className="pointer-events-none h-full w-full object-cover"
            />
          </div>
        )
      )}
    </div>
  );
};

const EditBackground = ({
  defaultValue,
  onSave,
  trigger,
}: {
  defaultValue: { backgroundId?: UniqueEntityID };
  onSave: (newValue: Partial<SessionProps>) => Promise<void>;
  trigger?: React.ReactNode;
}) => {
  // Use form
  const { watch, setValue, getValues, reset } =
    useForm<StepBackgroundSchemaType>({
      resolver: zodResolver(StepBackgroundSchema),
    });
  const backgroundId = watch("backgroundId");

  // Background list
  const { defaultBackgrounds, backgrounds } = useBackgroundStore();

  // Handle background click with auto-save
  const handleBackgroundClick = useCallback(
    async (newBackgroundId?: UniqueEntityID) => {
      // Set form value
      if (!newBackgroundId || backgroundId === newBackgroundId.toString()) {
        setValue("backgroundId", null);
        await onSave({
          backgroundId: undefined,
        });
      } else {
        setValue("backgroundId", newBackgroundId.toString());
        await onSave({
          backgroundId: newBackgroundId,
        });
      }
    },
    [backgroundId, setValue, onSave],
  );

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

  // Handle save
  const handleSave = useCallback(async () => {
    const formValues = getValues();
    await onSave({
      ...convertBackgroundFormToSessionProps(formValues),
    });
  }, [getValues, onSave]);

  return (
    <CustomSheet
      title="Background"
      trigger={trigger ?? <SvgIcon name="edit" size={24} />}
      onOpenChange={(open) => {
        if (open) {
          reset({
            backgroundId: defaultValue.backgroundId?.toString(),
          });
        }
      }}
      header={
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
                className="bg-background-card hover:bg-background-input flex cursor-pointer flex-col items-center justify-center rounded-2xl border-dashed p-8"
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
      }
    >
      <div className="flex flex-col gap-8">
        {backgrounds.length > 0 && (
          <div className="flex flex-col gap-4">
            <TypoLarge>User added backgrounds</TypoLarge>
            <div className="grid grid-cols-2 gap-4">
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
        <div className="flex flex-col gap-4">
          <TypoLarge>astrsk.ai provided backgrounds</TypoLarge>
          <div className="grid grid-cols-2 gap-4">
            <BackgroundListItem
              isActive={!backgroundId}
              onClick={() => handleBackgroundClick()}
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
    </CustomSheet>
  );
};

export { EditBackground, SelectedBackground };
