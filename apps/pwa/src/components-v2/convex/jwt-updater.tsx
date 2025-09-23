import { useAppStore } from "@/app/stores/app-store.tsx";
import { useAuth } from "@clerk/clerk-react";
import { useInterval } from "usehooks-ts";

const JwtUpdater = () => {
  const setJwt = useAppStore.use.setJwt();
  const { getToken } = useAuth();

  useInterval(async () => {
    const jwt = await getToken({ template: "convex" });
    setJwt(jwt);
  }, 1000);

  return null;
};

export { JwtUpdater };
