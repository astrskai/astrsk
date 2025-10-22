"use client";

import { Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { CardType } from "@/modules/card/domain";

interface ImageUploadProps {
  type: CardType;
  title?: string;
  iconAssetId?: UniqueEntityID;
  newIcon?: FileList;
  newIconProps?: UseFormRegisterReturn<"newIcon">;
}

export const ImageUpload = ({
  type,
  title = "",
  iconAssetId,
  newIcon,
  newIconProps,
}: ImageUploadProps) => {
  const [icon] = useAsset(iconAssetId);

  // New icon
  const [newIconUrl, setNewIconUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;

    if (newIcon && newIcon.length > 0) {
      const file = newIcon[0];
      objectUrl = URL.createObjectURL(file);
      setNewIconUrl(objectUrl);
    } else {
      setNewIconUrl(null);
    }

    // Cleanup function to revoke the object URL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [newIcon]);

  return (
    <div className="rounded-2xl w-full h-full overflow-hidden bg-background-surface-4">
      <label className="w-full h-full cursor-pointer block">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          {...newIconProps}
        />
        {newIconUrl || icon ? (
          <div className="relative group w-full h-full flex flex-col items-center justify-center">
            <img
              width={240}
              height={200}
              className="w-full h-full object-cover"
              src={newIconUrl ?? icon ?? "/img/card-icon-placeholder.png"}
              alt={title}
            />
            <div className="invisible group-hover:visible z-10 absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <div className="text-white text-sm">Change image</div>
            </div>
          </div>
        ) : (
          <div className="group w-full h-full flex flex-col items-center justify-center p-4">
            <ImageIcon size={64} className="text-background-container" />
            {/* <div className="text-muted-foreground group-hover:text-foreground text-xs mt-2">
              Click to upload
            </div> */}
          </div>
        )}
      </label>
    </div>
  );
};
