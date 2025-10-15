// Source: https://github.com/drizzle-team/drizzle-orm/discussions/1499#discussioncomment-8208985
export const getOneOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1) {
    throw new Error(`Expected exactly one value but found ${values.length}`);
  }
  return values[0];
};
