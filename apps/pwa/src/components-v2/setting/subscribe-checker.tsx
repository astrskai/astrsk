import { useAppStore } from "@/app/stores/app-store";
import { api } from "@/convex";
import { logger } from "@/shared/utils";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

const SubscribeChecker = () => {
  const subscription = useQuery(api.payment.public.getSubscription);
  const jwt = useAppStore.use.jwt();
  const setSubscribed = useAppStore.use.setSubscribed();

  // Update subscribed
  useEffect(() => {
    setSubscribed(!!subscription);
  }, [setSubscribed, subscription]);

  // Free subscription
  const claimFreeSubscription = useMutation(
    api.payment.public.claimFreeSubscription,
  );
  useEffect(() => {
    if (!jwt || subscription) {
      return;
    }
    (async () => {
      const result = await claimFreeSubscription();
      logger.debug(
        result
          ? "Success to claim free subscription"
          : "Failed to claim free subscription",
      );
    })();
  }, [claimFreeSubscription, jwt, subscription]);

  return null;
};

export { SubscribeChecker };
