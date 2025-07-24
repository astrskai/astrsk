import dayjs, { extend } from "dayjs";
import duration from "dayjs/plugin/duration";
import isToday from "dayjs/plugin/isToday";
import relativeTime from "dayjs/plugin/relativeTime";

extend(duration);
extend(isToday);
extend(relativeTime);

export const Datetime = dayjs;
