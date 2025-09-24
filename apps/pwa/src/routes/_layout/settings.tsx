import {
  createFileRoute,
  Outlet,
  useRouter,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";

const SettingsNotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-text-primary text-4xl font-bold">
          Settings Not Found
        </h1>
        <p className="text-text-secondary mt-4 text-lg">
          The settings page you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate({ to: "/settings" })}
          className="bg-primary-strong hover:bg-primary-strong/80 mt-6 rounded px-4 py-2 text-white"
        >
          Go to Settings
        </button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsLayoutWrapper,
  notFoundComponent: SettingsNotFoundPage,
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
