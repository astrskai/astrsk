import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

export const isPathWithBasePath = (path: string, basePath: string) => {
  const pattern = new RegExp(`^/${basePath}/[^/]+$`);
  return pattern.test(path);
};

export const getUniqueEntityIDFromPath = (path: string, key: string) => {
  if (isPathWithBasePath(path, key)) {
    const id = path.split(`/${key}/`)[1];

    return UniqueEntityID.isValidUUID(id) ? id : "";
  }

  return "";
};
