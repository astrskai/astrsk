import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-canvas text-fg-default flex min-h-screen w-full items-center justify-center p-6">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-brand-700 absolute top-[-10%] right-[-5%] h-[700px] w-[700px] rounded-full opacity-20 blur-[140px]" />
        <div className="bg-brand-500 absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
