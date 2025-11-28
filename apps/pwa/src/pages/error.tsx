import { useNavigate } from "@tanstack/react-router";
import { Logo } from "@/shared/assets/icons";
import { Button } from "@/shared/ui";

interface ErrorPageProps {
  title?: string;
  message?: string;
  redirectPath?: string;
  redirectLabel?: string;
  showGoBack?: boolean;
  showGoToHome?: boolean;
}

const ErrorPage = ({
  title = "Oops! Something went wrong",
  message = "An unexpected error occurred. Please try again or return to the previous page.",
  redirectPath,
  redirectLabel = "Go to page",
  showGoBack = true,
  showGoToHome = true,
}: ErrorPageProps) => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate({ to: "/" });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleRedirect = () => {
    if (redirectPath) {
      navigate({ to: redirectPath });
    }
  };

  // Safely format message - check if it's JSON and prettify it
  const formatMessage = (msg: string): { text: string; isJson: boolean } => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(msg);
      // If successful, format it with indentation
      return { text: JSON.stringify(parsed, null, 2), isJson: true };
    } catch {
      // Not JSON or parse failed, return as-is
      return { text: msg, isJson: false };
    }
  };

  const { text: formattedMessage, isJson } = formatMessage(message);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-14">
        <Logo />

        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-fg-muted text-4xl font-semibold">
            {title}
          </h1>
          {isJson ? (
            <pre className="text-fg-muted text-left text-sm leading-6 font-mono whitespace-pre-wrap max-w-2xl bg-surface-overlay p-4 rounded-lg">
              {formattedMessage}
            </pre>
          ) : (
            <p className="text-fg-muted text-center text-lg leading-8 font-normal whitespace-pre-line max-w-2xl">
              {formattedMessage}
            </p>
          )}
          <div className="flex gap-3">
            {showGoBack && (
              <Button
                onClick={handleGoBack}
                size="lg"
                variant="outline"
                className="cursor-pointer font-semibold"
              >
                Go back
              </Button>
            )}
            {redirectPath && (
              <Button
                onClick={handleRedirect}
                size="lg"
                variant="outline"
                className="cursor-pointer font-semibold"
              >
                {redirectLabel}
              </Button>
            )}
            {showGoToHome && (
              <Button
                onClick={handleGoToHome}
                size="lg"
                className="cursor-pointer font-semibold"
              >
                Go home
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
