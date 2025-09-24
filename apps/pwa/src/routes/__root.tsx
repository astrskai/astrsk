import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";

const RootLayer = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-text-primary text-6xl font-bold">404</h1>
        <p className="text-text-secondary mt-4 text-xl">Page not found</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="bg-primary-strong hover:bg-primary-strong/80 mt-6 rounded px-4 py-2 text-white"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export const Route = createRootRoute({
  component: RootLayer,
  notFoundComponent: NotFoundPage,
});
