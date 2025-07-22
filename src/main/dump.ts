import { app, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { DUMP_CHANNEL } from "../shared/ipc-channels";

interface DumpMetadata {
  database: string;
  assets: string[];
}

ipcMain.handle(DUMP_CHANNEL.GET_METADATA, async () => {
  // Get user data path
  const userDataPath = app.getPath("userData");

  // Get database dump
  const databaseDumpPath = path.join(userDataPath, "dump", "database.txt");
  if (!fs.existsSync(databaseDumpPath)) {
    return null;
  }
  const database = "database.txt";

  // Get assets dump
  const assets: string[] = [];
  const assetsDumpPath = path.join(userDataPath, "dump", "assets");
  if (fs.existsSync(assetsDumpPath)) {
    const files = fs.readdirSync(assetsDumpPath);
    assets.push(...files.map((file) => path.join("assets", file)));
  }

  // Return metadata
  return {
    database: database,
    assets: assets,
  } as DumpMetadata;
});

ipcMain.handle(DUMP_CHANNEL.GET_DUMP, async (_, dumpPath: string) => {
  // Get dump file path
  const userDataPath = app.getPath("userData");
  const fullDumpPath = path.join(userDataPath, "dump", path.normalize(dumpPath));

  // Check dump file exists
  if (!fs.existsSync(fullDumpPath)) {
    console.warn("[DEBUG] Dump file does not exist:", fullDumpPath);
    return null;
  }

  // Read dump file
  const dumpContent = fs.readFileSync(fullDumpPath, "utf-8");
  console.log("[DEBUG] Dump content read successfully");

  // Return dump content
  return dumpContent;
});

ipcMain.handle(DUMP_CHANNEL.SET_DUMP, async (_, dumpPath: string, dumpContent: string) => {
  // Get user data path
  const userDataPath = app.getPath("userData");
  const fullDumpPath = path.join(userDataPath, "dump", path.normalize(dumpPath));

  // Ensure dump directory exists
  const dumpDir = path.dirname(fullDumpPath);
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true });
  }

  // Write dump content to file
  fs.writeFileSync(fullDumpPath, dumpContent, "utf-8");
  console.log("[DEBUG] Dump content written successfully");
});

ipcMain.handle(DUMP_CHANNEL.DELETE_DUMP, async (_, dumpPath: string) => {
  // Get user data path
  const userDataPath = app.getPath("userData");
  const fullDumpPath = path.join(userDataPath, "dump", path.normalize(dumpPath));

  // Check if dump file exists
  if (!fs.existsSync(fullDumpPath)) {
    console.warn("[DEBUG] Dump file does not exist:", fullDumpPath);
    return;
  }

  // Delete dump file
  fs.unlinkSync(fullDumpPath);
  console.log("[DEBUG] Dump file deleted successfully");
});

export type { DumpMetadata };
