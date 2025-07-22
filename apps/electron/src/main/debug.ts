import { ipcMain, BrowserWindow } from "electron";
import { DEBUG_CHANNEL } from "../shared/ipc-channels";

ipcMain.handle(DEBUG_CHANNEL.OPEN_DEV_TOOLS, () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.openDevTools();
  }
});
