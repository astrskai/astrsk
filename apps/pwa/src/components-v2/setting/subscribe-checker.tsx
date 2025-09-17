import { useAppStore } from "@/app/stores/app-store";
import { api } from "@/convex";
import { logger } from "@/shared/utils";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

const SubscribeChecker = () => {
  const subscription = useQuery(api.payment.public.getSubscription);
  const setSubscribed = useAppStore.use.setSubscribed();

  // Update subscribed
  useEffect(() => {
    setSubscribed(!!subscription);
  }, [setSubscribed, subscription]);

  // Free subscription
  const startFreeSubscription = useMutation(
    api.payment.public.startFreeSubscription,
  );
  useEffect(() => {
    if (subscription) {
      return;
    }
    (async () => {
      const result = await startFreeSubscription();
      logger.debug(
        result
          ? "Success to start free subscription"
          : "Failed to start free subscription",
      );
    })();
  }, [startFreeSubscription, subscription]);

  return null;
};

export { SubscribeChecker };
