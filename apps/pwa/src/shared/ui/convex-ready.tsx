import { ReactNode } from "react";

const isConvexReady =
  import.meta.env.VITE_CONVEX_URL &&
  import.meta.env.VITE_CONVEX_SITE_URL;

const ConvexReady = ({ children }: { children?: ReactNode }) => {
  return isConvexReady ? <>{children}</> : null;
};

export { ConvexReady };
