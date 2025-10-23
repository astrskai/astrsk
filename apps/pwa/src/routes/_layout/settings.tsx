import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FloatingActionButton } from "@/shared/ui";
import NotFound from "@/pages/not-found";

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsLayoutWrapper,
  notFoundComponent: NotFound,
});

function SettingsLayoutWrapper() {
  const router = useRouter();

  const handleBack = () => {
    router.history.back();
  };

  return (
    <>
      <FloatingActionButton
        icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
        label="Back"
        position="top-left"
        className="z-50"
        onClick={handleBack}
      />

      <Outlet />
    </>
  );
}
