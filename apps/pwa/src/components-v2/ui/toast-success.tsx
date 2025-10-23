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
        "w-[388px] p-[16px] pr-[24px] bg-[#FFFFFF]",
        "border-[1px] border-[#E4E4E7] rounded-[8px]",
        "flex flex-col gap-[4px]",
      )}
    >
      <div className="h-[28px] flex flex-row gap-[4px] items-center text-[#18181B]">
        <CircleCheck size={16} className="m-[6px]" />
        <div className="w-full font-[600] text-[14px] leading-[20px] truncate">
          {title}
        </div>
      </div>
      <div className="font-[400] text-[14px] leading-[20px] text-[#2F2F32] line-clamp-2">
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
