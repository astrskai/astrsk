// Source: https://ui.shadcn.com/docs/components/typography
import { cn } from "@/shared/lib/cn";

function Typo3XLarge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-3xl font-semibold tracking-tight text-text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Typo2XLarge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-2xl font-semibold tracking-tight text-text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TypoXLarge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-xl font-semibold tracking-tight text-text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TypoLarge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-lg font-medium text-text-primary", className)}>
      {children}
    </div>
  );
}

function TypoBase({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <small
      className={cn(
        "text-base font-medium leading-none text-text-primary",
        className,
      )}
    >
      {children}
    </small>
  );
}

function TypoSmall({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <small
      className={cn(
        "text-sm font-medium leading-none text-text-primary",
        className,
      )}
    >
      {children}
    </small>
  );
}

function TypoTiny({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <small
      className={cn(
        "text-xs font-light leading-none text-text-primary",
        className,
      )}
    >
      {children}
    </small>
  );
}

export {
  TypoLarge,
  TypoBase,
  TypoSmall,
  TypoTiny,
  TypoXLarge,
  Typo2XLarge,
  Typo3XLarge,
};
