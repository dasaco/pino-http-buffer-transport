import build from "pino-abstract-transport";
import { pipeline, Transform } from "node:stream";
import { LogBuffer, LogBufferOptions } from "./log-buffer";

export default async (opts: LogBufferOptions) => {
  const destination = process.stdout;
  const logBuffer = new LogBuffer(opts);

  return build((source) => {
    const stream = new Transform({
      objectMode: true,
      autoDestroy: true,
      transform(obj, enc, cb) {
        const releasableLogs = logBuffer.processLog(obj);
        cb(null, releasableLogs);
      },
    });

    pipeline(source, stream, destination, () => {});
  });
};
