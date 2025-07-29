import { is } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import fs from "fs";
import path from "path";
import { UPDATER_CHANNEL } from "../shared/ipc-channels";

function initUpdater(): void {
  // Check if the app is in development mode
  if (is.dev) {
    return;
  }

  // Configure auto updater
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "astrskai",
    repo: "astrsk",
    private: false, // Public repo, no authentication needed.
  });

  // Check updates on startup
  autoUpdater.checkForUpdates();
}

// Handle auto updater methods
ipcMain.handle(UPDATER_CHANNEL.CHECK_FOR_UPDATES, async () => {
  return autoUpdater.checkForUpdates();
});
ipcMain.handle(UPDATER_CHANNEL.QUIT_AND_INSTALL, async (_, ...args) => {
  return autoUpdater.quitAndInstall(...args);
});
ipcMain.handle(UPDATER_CHANNEL.DOWNLOAD_UPDATE, async (_, ...args) => {
  return autoUpdater.downloadUpdate(...args);
});
ipcMain.handle(UPDATER_CHANNEL.RELAUNCH, async () => {
  app.relaunch();
  app.exit();
});
ipcMain.handle(UPDATER_CHANNEL.GET_DUMP, async () => {
  // Get dump file path
  const userDataPath = app.getPath("userData");
  const dumpPath = path.join(userDataPath, "dump.txt");
  console.log("[DEBUG] dumpPath:", dumpPath);

  // Check dump file exists
  if (!fs.existsSync(dumpPath)) {
    console.warn("[DEBUG] Dump file does not exist:", dumpPath);
    return null;
  }

  // Read dump file
  const dumpContent = fs.readFileSync(dumpPath, "utf-8");
  console.log("[DEBUG] Dump content read successfully");
  return dumpContent;
});

// Handle auto updater events
function setUpdaterCallbacks(window: BrowserWindow): void {
  autoUpdater.on("error", (...args) => {
    window.webContents.send(UPDATER_CHANNEL.ON_ERROR, ...args);
  });
  autoUpdater.on("update-available", (...args) => {
    window.webContents.send(UPDATER_CHANNEL.ON_UPDATE_AVAILABLE, ...args);
  });
  autoUpdater.on("download-progress", (...args) => {
    window.webContents.send(UPDATER_CHANNEL.ON_DOWNLOAD_PROGRESS, ...args);
  });
  autoUpdater.on("update-downloaded", (...args) => {
    window.webContents.send(UPDATER_CHANNEL.ON_UPDATE_DOWNLOADED, ...args);
  });
}

export { initUpdater, setUpdaterCallbacks };
