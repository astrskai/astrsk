import fs from "fs/promises";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import { readChunk } from "read-chunk";

// TODO: handle exceptional case, use stream (https://github.com/harpychat/h2o-app-nextjs/pull/33#discussion_r1801651937)
export async function readFile(filePath: string): Promise<File> {
  // Resolve file path
  const resolvedPath = path.resolve(process.cwd(), filePath);

  // Get mime type
  const chunk = await readChunk(resolvedPath, { length: 4100 });
  const type = await fileTypeFromBuffer(chunk);
  const bag = { type: type ? type.mime : "application/octet-stream" };

  // Make file
  const buffer = await fs.readFile(resolvedPath);
  const blob = new Blob([buffer], bag);
  const file = new File([blob], path.basename(resolvedPath), bag);

  return file;
}
