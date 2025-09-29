import { useNavigate } from "@tanstack/react-router";
import { Logo } from "@/assets/components/icons";
import { Button } from "@/components-v2/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-14">
        <Logo />

        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-text-secondary text-4xl font-semibold">
            Oops! Page Not Found
          </h1>
          <p className="text-text-secondary text-center text-lg leading-8 font-normal">
            It looks like the page you’re searching for doesn’t exist or has
            been moved.
            <br /> Let’s get you back to where you need to be.
          </p>
          <Button
            onClick={handleGoToHome}
            size="lg"
            className="cursor-pointer font-semibold"
          >
            Let's go home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
