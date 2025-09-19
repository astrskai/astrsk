import { Button } from "@/components-v2/ui/button";
import { api } from "@/convex";
import { Datetime } from "@/shared/utils";
import { usePaginatedQuery } from "convex/react";

const PAGE_SIZE = 10;

function formatNumberWithComma(num: number): string {
  return num.toLocaleString();
}

const CreditUsageItem = ({
  item,
}: {
  item: {
    _id: string;
    _creationTime: number;
    amount: number;
    detail?: {
      session_id: string;
      flow_id: string;
      model_id: string;
      input_tokens: number;
      output_tokens: number;
    };
  };
}) => {
  return (
    <div className="flex flex-row *:p-2 *:w-[120px] *:h-[40px] *:truncate text-text-primary">
      <div className="min-w-[160px]">
        {Datetime(item._creationTime).format("MMM D, h:mm A")}
      </div>
      <div className="min-w-[240px]">{item.detail?.model_id}</div>
      <div>
        {formatNumberWithComma(item.detail?.input_tokens ?? 0)}
        {" -> "}
        {formatNumberWithComma(item.detail?.output_tokens ?? 0)}
      </div>
      <div className="text-right">{formatNumberWithComma(item.amount)}</div>
    </div>
  );
};

const CreditUsagePage = () => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.credit.public.listCreditUsage,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <div className="fixed inset-0 left-0 z-40 overflow-y-auto py-[80px]">
      <div className="max-w-[640px] mx-auto text-text-primary">
        {/* Header with back button */}
        <div className="flex items-center mb-[54px]">
          <div className="flex items-center justify-center h-full">
            <h1 className="text-2xl font-semibold">Credit usage history</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col text-[14px] leading-[20px] font-[500]">
          <div className="flex flex-row *:p-2 *:w-[120px] *:h-[40px] text-text-placeholder">
            <div className="min-w-[160px]">Timestamp</div>
            <div className="min-w-[240px]">Model</div>
            <div>Tokens</div>
            <div className="text-right">Cost</div>
          </div>
          {results?.map((item) => (
            <CreditUsageItem key={item._id} item={item} />
          ))}
          {status === "CanLoadMore" && (
            <Button
              variant="secondary"
              onClick={() => {
                loadMore(PAGE_SIZE);
              }}
            >
              Load More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditUsagePage;
