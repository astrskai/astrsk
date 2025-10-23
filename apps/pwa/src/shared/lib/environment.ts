/**
 * Environment detection utilities for determining runtime context
 * Used to differentiate between Electron PWA and web browser environments
 */

/**
 * Detects if the application is running in an Electron environment
 * @returns true if running in Electron, false if running in web browser
 */
export const isElectronEnvironment = (): boolean => {
  // Check for Electron-specific window properties
  // window.electron is injected by Electron preload script
  // window.api contains IPC communication methods for Electron
  return !!(
    typeof window !== 'undefined' &&
    window.electron &&
    window.api?.topBar
  );
};

/**
 * Initializes environment-specific configurations
 * Should be called once during application startup
 */
export const initializeEnvironment = (): void => {
  // Add body class for web version to enable CSS variable overrides
  if (!isElectronEnvironment()) {
    document.body.classList.add('web-version');
  }
};

/**
 * Get the current environment type
 * @returns 'electron' or 'web'
 */
export const getEnvironmentType = (): 'electron' | 'web' => {
  return isElectronEnvironment() ? 'electron' : 'web';
};

/**
 * Get environment-specific configuration values
 */
export const getEnvironmentConfig = () => {
  const isElectron = isElectronEnvironment();

  return {
    isElectron,
    isWeb: !isElectron,
    topbarHeight: isElectron ? 38 : 0,
    environment: getEnvironmentType(),
  };
};
