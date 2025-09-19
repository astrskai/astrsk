import { useAppStore } from "@/app/stores/app-store";
import { api } from "@/convex";
import { useQuery } from "convex/react";
import { useEffect } from "react";

const SubscribeChecker = () => {
  const subscription = useQuery(api.payment.public.getSubscription);
  const setSubscribed = useAppStore.use.setSubscribed();

  // Update subscribed
  useEffect(() => {
    setSubscribed(!!subscription);
  }, [setSubscribed, subscription]);

  return null;
};

export { SubscribeChecker };
