export const isPathWithId = (path: string, basePath: string) => {
  const pattern = new RegExp(`^/${basePath}/[^/]+$`);
  return pattern.test(path);
};

export const getSelectedIdFromPath = (path: string, key: string) => {
  return isPathWithId(path, key) ? path.split(`/${key}/`)[1] : "";
};
