import build from "pino-abstract-transport";
import SonicBoom from "sonic-boom";
import { pipeline, Transform } from "node:stream";
import { LogBuffer } from "./log-buffer";

export const transportFn = async (opts: any) => {
  const destination = getStream(opts.destination);
  const logBuffer = new LogBuffer();

  return build((source) => {
    const stream = new Transform({
      objectMode: true,
      autoDestroy: true,
      transform(obj, enc, cb) {
        const releasableLogs = logBuffer.processLog(obj);
        cb(null, releasableLogs);
      },
    });

    // @ts-ignore
    pipeline(source, stream, destination, () => {});
  });
};

function getStream(fileDescriptor: any) {
  if (fileDescriptor === 1 || !fileDescriptor) return process.stdout;
  if (fileDescriptor === 2) return process.stderr;
  return new SonicBoom({ dest: fileDescriptor, sync: false });
}
