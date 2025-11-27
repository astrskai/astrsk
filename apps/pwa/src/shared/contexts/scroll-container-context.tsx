import { createContext, useContext, useRef, type RefObject } from "react";

interface ScrollContainerContextValue {
  scrollContainerRef: RefObject<HTMLElement> | null;
  scrollToTop: () => void;
}

const ScrollContainerContext = createContext<
  ScrollContainerContextValue | undefined
>(undefined);

export function ScrollContainerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollContainerRef = useRef<HTMLElement>(null);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  return (
    <ScrollContainerContext.Provider
      value={{ scrollContainerRef, scrollToTop }}
    >
      {children}
    </ScrollContainerContext.Provider>
  );
}

export function useScrollContainer() {
  const context = useContext(ScrollContainerContext);
  if (!context) {
    throw new Error(
      "useScrollContainer must be used within ScrollContainerProvider",
    );
  }
  return context;
}
