import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Import, Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/shared/hooks/use-asset";
import { BackgroundService } from "@/app/services/background-service";
import {
  backgroundQueries,
  defaultBackgrounds,
  getDefaultBackground,
  getBackgroundAssetId,
  isDefaultBackground,
} from "@/entities/background/api";
import { CustomSheet } from "./custom-sheet";
import {
  BackgroundListItem,
  convertBackgroundFormToSessionProps,
  StepBackgroundSchema,
  StepBackgroundSchemaType,
} from "@/features/session/create-session/step-background";
import {
  Button, Dialog, DialogContent, DialogTitle,
  SvgIcon, TypoBase,
} from "@/shared/ui";
import { SessionProps } from "@/entities/session/domain/session";

const SelectedBackground = ({
  backgroundId,
  sessionId,
}: {
  backgroundId?: UniqueEntityID;
  sessionId?: UniqueEntityID;
}) => {
  // Check if it's a default background first
  const defaultBg = backgroundId ? getDefaultBackground(backgroundId) : undefined;

  // Query for user background if not a default
  const { data: background } = useQuery({
    ...backgroundQueries.detail(backgroundId),
    enabled: !!backgroundId && !defaultBg,
  });

  const [asset] = useAsset(getBackgroundAssetId(background));

  return (
    <div className="bg-canvas h-[198px] overflow-hidden rounded-[14px]">
      {defaultBg ? (
        <div style={{ height: "198px", position: "relative" }}>
          <img
            src={defaultBg.src}
            alt={defaultBg.name ?? "Background"}
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>
      ) : background && !isDefaultBackground(background) && asset ? (
        <div style={{ height: "198px", position: "relative" }}>
          <img
            src={asset}
            alt={background.name ?? "Background"}
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
};

const EditBackground = ({
  sessionId,
  defaultValue,
  onSave,
  trigger,
}: {
  sessionId: UniqueEntityID;
  defaultValue: { backgroundId?: UniqueEntityID };
  onSave: (newValue: Partial<SessionProps>) => Promise<void>;
  trigger?: React.ReactNode;
}) => {
  const queryClient = useQueryClient();

  // Use form
  const { watch, setValue, reset } =
    useForm<StepBackgroundSchemaType>({
      resolver: zodResolver(StepBackgroundSchema),
    });
  const backgroundId = watch("backgroundId");

  // Query user backgrounds for this session
  const { data: userBackgrounds = [] } = useQuery(
    backgroundQueries.listBySession(sessionId),
  );

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
  const handleAddNewBackground = useCallback(
    async (file: File) => {
      // Save file to background with session ID
      const backgroundOrError =
        await BackgroundService.saveFileToBackground.execute({
          file,
          sessionId,
        });
      if (backgroundOrError.isFailure) {
        return;
      }

      // Invalidate query to refresh backgrounds
      queryClient.invalidateQueries({
        queryKey: backgroundQueries.listBySession(sessionId).queryKey,
      });

      // Close dialog
      setIsOpenImportDialog(false);
    },
    [sessionId, queryClient],
  );

  // Handle delete background
  const handleDeleteBackground = useCallback(
    async (bgId: UniqueEntityID) => {
      const backgroundOrError =
        await BackgroundService.deleteBackground.execute(bgId);
      if (backgroundOrError.isFailure) {
        return;
      }

      // Invalidate query to refresh backgrounds
      queryClient.invalidateQueries({
        queryKey: backgroundQueries.listBySession(sessionId).queryKey,
      });
    },
    [sessionId, queryClient],
  );

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
                className="bg-surface-raised hover:bg-surface-overlay flex cursor-pointer flex-col items-center justify-center rounded-2xl border-dashed p-8"
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
                <Import size={72} className="text-fg-subtle" />
                <div>
                  <TypoBase className="text-fg-subtle">
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
      {/* Combined list: No Background → User added (deletable) → Default backgrounds */}
      <div className="grid grid-cols-2 gap-4">
        {/* No background option */}
        <BackgroundListItem
          isActive={!backgroundId}
          onClick={() => handleBackgroundClick()}
        />

        {/* User added backgrounds (deletable) */}
        {userBackgrounds.map((background) => (
          <BackgroundListItem
            key={background.id.toString()}
            assetId={background.assetId}
            isEditable
            isActive={backgroundId === background.id.toString()}
            onClick={() => handleBackgroundClick(background.id)}
            onDelete={() => handleDeleteBackground(background.id)}
          />
        ))}

        {/* Default astrsk backgrounds (not deletable) */}
        {defaultBackgrounds.map((defaultBackground) => (
          <BackgroundListItem
            key={defaultBackground.id.toString()}
            src={defaultBackground.src}
            isActive={backgroundId === defaultBackground.id.toString()}
            onClick={() => handleBackgroundClick(defaultBackground.id)}
          />
        ))}
      </div>
    </CustomSheet>
  );
};

export { EditBackground, SelectedBackground };
