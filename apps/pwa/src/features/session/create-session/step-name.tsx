import { useState } from "react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  Button,
  FloatingLabelInput,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui";

const StepName = ({
  defaultValue = "",
  onNext,
  trigger,
}: {
  defaultValue?: string;
  onNext: (newValue: string) => Promise<void>;
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>(defaultValue);
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        hideClose
        onOpenAutoFocus={isMobile ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>Name your session</DialogDescription>
        </DialogHeader>
        <FloatingLabelInput
          label="Session name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setName(defaultValue);
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="lg"
            type="submit"
            onClick={async () => {
              await onNext(name);
              setOpen(false);
              setName(defaultValue);
            }}
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { StepName };
