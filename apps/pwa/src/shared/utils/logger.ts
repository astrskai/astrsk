import { ILogObj, Logger } from "tslog";

// TODO: improve logger (https://github.com/harpychat/h2o-app-nextjs/pull/51#discussion_r1831975009)
export const logger: Logger<ILogObj> = new Logger();
