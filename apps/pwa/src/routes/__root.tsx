import { createRootRoute, Outlet } from "@tanstack/react-router";
import NotFound from "@/pages/not-found";

const RootLayer = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

export const Route = createRootRoute({
  component: RootLayer,
  notFoundComponent: NotFound,
});
