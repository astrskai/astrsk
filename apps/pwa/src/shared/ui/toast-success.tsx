import { cn } from "@/shared/lib";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";

const CustomSuccess = ({
  title,
  details,
}: {
  title: string;
  details: string;
}) => {
  return (
    <div
      className={cn(
        "w-[calc(100vw-2rem)] bg-[#FFFFFF] p-[8px] pr-[24px] md:w-[388px] md:p-[16px]",
        "rounded-[8px] border-[1px] border-[#E4E4E7]",
        "flex flex-col gap-[4px]",
      )}
    >
      <div className="flex h-[28px] flex-row items-center gap-[4px] text-[#18181B]">
        <CircleCheck size={16} className="m-[6px]" />
        <div className="w-full truncate text-[14px] leading-[20px] font-[600]">
          {title}
        </div>
      </div>
      <div className="line-clamp-2 text-[14px] leading-[20px] font-[400] text-[#2F2F32]">
        {details}
      </div>
    </div>
  );
};

const toastSuccess = ({
  title,
  details,
}: {
  title: string;
  details: string;
}) => {
  toast.custom((toastId) => <CustomSuccess title={title} details={details} />);
};

export { toastSuccess };
