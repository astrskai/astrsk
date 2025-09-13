import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
  Rectangle,
  screen,
  shell,
} from "electron";

// Set name to consist user data directory
app.setName("astrsk_ai");

import Store from "electron-store";
import { join } from "path";
import icon from "../../resources/icon.png?asset";
import { CONFIG_CHANNEL, TOP_BAR_CHANNEL } from "../shared/ipc-channels";
import "./debug";
import "./dump";
import { setTopBarCallbacks } from "./top-bar";
import { initUpdater, setUpdaterCallbacks } from "./updater";

const windowStateStore = new Store<{
  bounds: Rectangle;
  isMaximized: boolean;
}>({
  defaults: {
    bounds: { width: 1920, height: 1120, x: 0, y: 0 },
    isMaximized: false,
  },
});

function isBoundsInDisplay(bounds: Rectangle): boolean {
  const displays = screen.getAllDisplays();
  return displays.some((display) => {
    const area = display.workArea;
    return (
      bounds.x >= area.x &&
      bounds.y >= area.y &&
      bounds.x + bounds.width <= area.x + area.width &&
      bounds.y + bounds.height <= area.y + area.height
    );
  });
}

interface ElectronLevelConfig {
  allowInsecureContent: boolean;
}

const electronLevelConfigStore = new Store<ElectronLevelConfig>({
  defaults: {
    allowInsecureContent: false,
  },
});

ipcMain.handle(CONFIG_CHANNEL.GET_CONFIG, (_, key: string) => {
  return electronLevelConfigStore.get(key);
});

ipcMain.handle(CONFIG_CHANNEL.SET_CONFIG, (_, key: string, value: any) => {
  electronLevelConfigStore.set(key, value);
});

function createMainWindow(): BrowserWindow {
  const allowInsecureContent = electronLevelConfigStore.get("allowInsecureContent");
  if (allowInsecureContent) {
    app.commandLine.appendSwitch("disable-web-security");
    app.commandLine.appendSwitch("disable-features", "BlockInsecurePrivateNetworkRequests");
  }

  // Create browser window options.
  let mainWindowOptions: BrowserWindowConstructorOptions = {
    // Window position and size settings.
    minWidth: 1000,
    minHeight: 500,

    // Showing the window gracefully.
    // see https://www.electronjs.org/docs/latest/api/browser-window#showing-the-window-gracefully
    show: false,
    backgroundColor: "#1B1B1B",

    // Title bar settings.
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    ...(process.platform === "linux" ? { icon } : {}),

    // Webview settings.
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,

      // Allow insecure content
      ...(allowInsecureContent && {
        webSecurity: false,
        allowRunningInsecureContent: true,
      }),
    },
  };

  // Check bounds in display and restore window state.
  const bounds = windowStateStore.get("bounds");
  const isMaximized = windowStateStore.get("isMaximized");
  if (isBoundsInDisplay(bounds)) {
    mainWindowOptions = {
      ...mainWindowOptions,
      width: windowStateStore.get("bounds").width,
      height: windowStateStore.get("bounds").height,
      x: windowStateStore.get("bounds").x,
      y: windowStateStore.get("bounds").y,
    };
  }

  // Create main window with the options.
  const mainWindow = new BrowserWindow(mainWindowOptions);

  // Show the window when it is ready to be shown.
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    if (isMaximized) {
      mainWindow.maximize();
    }
  });

  // Save the window state when it is closed.
  mainWindow.on("close", () => {
    if (!mainWindow.isMinimized() && !mainWindow.isFullScreen()) {
      windowStateStore.set("bounds", mainWindow.getBounds());
      windowStateStore.set("isMaximized", mainWindow.isMaximized());
    }
  });

  // Open links in the default browser instead of the app.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Open DevTools in development mode.
  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }

  // Load the PWA URL.
  mainWindow.loadURL(import.meta.env.MAIN_VITE_PWA_URL);

  // Set window related callbacks.
  setUpdaterCallbacks(mainWindow);
  setTopBarCallbacks(mainWindow);

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.astrsk.ai-app");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window, { zoom: true });
  });

  // Create main window.
  createMainWindow();

  // Initialize auto updater.
  initUpdater();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle(TOP_BAR_CHANNEL.NEW_WINDOW, async () => {
  createMainWindow();
});
