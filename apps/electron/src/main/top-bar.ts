import { BrowserWindow, ipcMain } from "electron";
import { TOP_BAR_CHANNEL } from "../shared/ipc-channels";

function getFocusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow();
}

// Handle top bar methods
ipcMain.handle(TOP_BAR_CHANNEL.WINDOW_MINIMIZE, () => {
  const focusedWindow = getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.minimize();
  }
});
ipcMain.handle(TOP_BAR_CHANNEL.WINDOW_MAXIMIZE, () => {
  const focusedWindow = getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.maximize();
  }
});
ipcMain.handle(TOP_BAR_CHANNEL.WINDOW_UNMAXIMIZE, () => {
  const focusedWindow = getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.unmaximize();
  }
});
ipcMain.handle(TOP_BAR_CHANNEL.WINDOW_CLOSE, () => {
  const focusedWindow = getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

// Handle top bar events
function setTopBarCallbacks(window: BrowserWindow): void {
  window.on("maximize", () => {
    window.webContents.send(TOP_BAR_CHANNEL.ON_WINDOW_MAXIMIZED);
  });
  window.on("unmaximize", () => {
    window.webContents.send(TOP_BAR_CHANNEL.ON_WINDOW_UNMAXIMIZED);
  });
}

export { setTopBarCallbacks };
