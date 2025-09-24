export const isExactPath = (path: string, exactPath: string) => {
  const pathSegments = path.split("/");

  return pathSegments[1] === exactPath;
};

export const getSelectedIdFromPath = (path: string, key: string) => {
  return isExactPath(path, key) ? path.split(`/${key}/`)[1] : null;
};
