import { usePwa } from "@/shared/hooks/use-pwa";
import { useEffect, useState } from "react";
import { isMobile as isUaMobile } from "react-device-detect";

export function useDeviceType() {
  // Initialize mobile state with a quick check
  const getInitialMobileState = () => {
    // Check modern way first
    const nav = navigator as any;
    if (nav.userAgentData && typeof nav.userAgentData.mobile === "boolean") {
      return nav.userAgentData.mobile;
    }
    // Fallback to react-device-detect
    return isUaMobile;
  };

  // Check mobile
  const [isMobile, setIsMobile] = useState(getInitialMobileState);
  const [isMobileChecked, setIsMobileChecked] = useState(false);

  useEffect(() => {
    // Double-check mobile detection after mount
    const nav = navigator as any;
    if (nav.userAgentData && typeof nav.userAgentData.mobile === "boolean") {
      setIsMobile(nav.userAgentData.mobile);
    } else {
      // Fallback
      setIsMobile(isUaMobile);
    }
    setIsMobileChecked(true);
  }, []);

  // Check PWA
  const { isStandalone } = usePwa();

  // Check electron
  const [isElectron, setIsElectron] = useState(false);
  useEffect(() => {
    // Wait for mobile check to complete
    if (!isMobileChecked || isMobile) {
      return;
    }

    // Check electron preload
    if (window.electron && window.api) {
      setIsElectron(true);
    } else {
      // If not electron, Go to the landing page
      // if (!import.meta.env.DEV) {
      //   window.location.href = "https://astrsk.ai/";
      // }
    }
  }, [isMobile, isMobileChecked]);

  return {
    isMobile,
    isStandalone,
    isElectron,
  } as const;
}

// Backward compatibility hook
export function useIsMobile() {
  const { isMobile } = useDeviceType();
  return isMobile;
}
