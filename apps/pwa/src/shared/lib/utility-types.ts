export type PartialOmit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]?: T[P];
};
