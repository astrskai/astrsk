import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import {
  CancellationToken,
  ProgressInfo,
  UpdateCheckResult,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater/out/types";
import { DumpMetadata } from "../main/dump";
import {
  CONFIG_CHANNEL,
  DEBUG_CHANNEL,
  DUMP_CHANNEL,
  TOP_BAR_CHANNEL,
  UPDATER_CHANNEL,
} from "../shared/ipc-channels";

// Custom APIs for renderer
const api = {
  updater: {
    checkForUpdates: async (): Promise<UpdateCheckResult | null> =>
      ipcRenderer.invoke(UPDATER_CHANNEL.CHECK_FOR_UPDATES),
    quitAndInstall: async (isSilent?: boolean, isForceRunAfter?: boolean): Promise<void> =>
      ipcRenderer.invoke(UPDATER_CHANNEL.QUIT_AND_INSTALL, isSilent, isForceRunAfter),
    downloadUpdate: async (cancellationToken?: CancellationToken): Promise<Array<string>> =>
      ipcRenderer.invoke(UPDATER_CHANNEL.DOWNLOAD_UPDATE, cancellationToken),
    relaunch: async (): Promise<void> => ipcRenderer.invoke(UPDATER_CHANNEL.RELAUNCH),
    getDump: async (): Promise<string | null> => ipcRenderer.invoke(UPDATER_CHANNEL.GET_DUMP),
    onError: (callback: (error: Error, message?: string) => void) => {
      ipcRenderer.on(UPDATER_CHANNEL.ON_ERROR, (_, error: Error, message?: string) =>
        callback(error, message),
      );
    },
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      ipcRenderer.on(UPDATER_CHANNEL.ON_UPDATE_AVAILABLE, (_, info: UpdateInfo) => callback(info));
    },
    onDownloadProgress: (callback: (info: ProgressInfo) => void) => {
      ipcRenderer.on(UPDATER_CHANNEL.ON_DOWNLOAD_PROGRESS, (_, info: ProgressInfo) =>
        callback(info),
      );
    },
    onUpdateDownloaded: (callback: (event: UpdateDownloadedEvent) => void) => {
      ipcRenderer.on(UPDATER_CHANNEL.ON_UPDATE_DOWNLOADED, (_, event: UpdateDownloadedEvent) =>
        callback(event),
      );
    },
  },
  topBar: {
    windowMinimize: async (): Promise<void> => ipcRenderer.invoke(TOP_BAR_CHANNEL.WINDOW_MINIMIZE),
    windowMaximize: async (): Promise<void> => ipcRenderer.invoke(TOP_BAR_CHANNEL.WINDOW_MAXIMIZE),
    windowUnmaximize: async (): Promise<void> =>
      ipcRenderer.invoke(TOP_BAR_CHANNEL.WINDOW_UNMAXIMIZE),
    windowClose: async (): Promise<void> => ipcRenderer.invoke(TOP_BAR_CHANNEL.WINDOW_CLOSE),
    newWindow: async (): Promise<void> => ipcRenderer.invoke(TOP_BAR_CHANNEL.NEW_WINDOW),
    onWindowMaximized: (callback: () => void) => {
      ipcRenderer.on(TOP_BAR_CHANNEL.ON_WINDOW_MAXIMIZED, () => callback());
    },
    onWindowUnmaximized: (callback: () => void) => {
      ipcRenderer.on(TOP_BAR_CHANNEL.ON_WINDOW_UNMAXIMIZED, () => callback());
    },
  },
  dump: {
    getMetadata: async (): Promise<DumpMetadata | null> =>
      ipcRenderer.invoke(DUMP_CHANNEL.GET_METADATA),
    getDump: async (dumpPath: string): Promise<string | null> =>
      ipcRenderer.invoke(DUMP_CHANNEL.GET_DUMP, dumpPath),
    setDump: async (dumpPath: string, dumpContent: string): Promise<void> =>
      ipcRenderer.invoke(DUMP_CHANNEL.SET_DUMP, dumpPath, dumpContent),
    deleteDump: async (dumpPath: string): Promise<void> =>
      ipcRenderer.invoke(DUMP_CHANNEL.DELETE_DUMP, dumpPath),
  },
  debug: {
    openDevTools: async (): Promise<void> => ipcRenderer.invoke(DEBUG_CHANNEL.OPEN_DEV_TOOLS),
  },
  config: {
    getConfig: (key: string): Promise<any> => ipcRenderer.invoke(CONFIG_CHANNEL.GET_CONFIG, key),
    setConfig: (key: string, value: any): Promise<void> =>
      ipcRenderer.invoke(CONFIG_CHANNEL.SET_CONFIG, key, value),
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
