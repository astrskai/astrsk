const UPDATER_CHANNEL = {
  // Methods
  CHECK_FOR_UPDATES: "updater/check-for-updates",
  QUIT_AND_INSTALL: "updater/quit-and-install",
  DOWNLOAD_UPDATE: "updater/download-update",
  RELAUNCH: "updater/relaunch",
  GET_DUMP: "updater/get-dump",

  // Events
  ON_ERROR: "updater/on-error",
  ON_UPDATE_AVAILABLE: "updater/on-update-available",
  ON_DOWNLOAD_PROGRESS: "updater/on-download-progress",
  ON_UPDATE_DOWNLOADED: "updater/on-update-downloaded",
} as const;

const TOP_BAR_CHANNEL = {
  // Methods
  WINDOW_MINIMIZE: "top-bar/window-minimize",
  WINDOW_MAXIMIZE: "top-bar/window-maximize",
  WINDOW_UNMAXIMIZE: "top-bar/window-unmaximize",
  WINDOW_CLOSE: "top-bar/window-close",
  NEW_WINDOW: "top-bar/new-window",

  // Events
  ON_WINDOW_MAXIMIZED: "top-bar/on-window-maximized",
  ON_WINDOW_UNMAXIMIZED: "top-bar/on-window-unmaximized",
} as const;

const DUMP_CHANNEL = {
  // Methods
  GET_METADATA: "dump/get-metadata",
  GET_DUMP: "dump/get-dump",
  SET_DUMP: "dump/set-dump",
  DELETE_DUMP: "dump/delete-dump",
} as const;

const DEBUG_CHANNEL = {
  // Methods
  OPEN_DEV_TOOLS: "debug/open-dev-tools",
} as const;

export { DEBUG_CHANNEL, DUMP_CHANNEL, TOP_BAR_CHANNEL, UPDATER_CHANNEL };
