import { prettyFactory } from "pino-pretty";

// Pino-Http attaches request context to the log object.
interface LogObject {
  reqId: string;
  res: {
    statusCode: number;
  };
  req: {
    id: string;
  };
}

export class LogBuffer {
  logStorage: { [key: string]: object[] } = {};

  private prettyPrinter = prettyFactory({
    colorize: true,
  });

  processLog(logObject: LogObject): string | null {
    const reqId = logObject.reqId || logObject.req?.id;

    if (!reqId) {
      return this.prettyPrinter(logObject);
    }

    if (logObject.res) {
      if (logObject.res?.statusCode >= 500) {
        const bufferedLogs = this.logStorage[reqId];
        return (
          bufferedLogs?.map((log) => this.prettyPrinter(log)).join("") || null
        );
      }

      delete this.logStorage[reqId];
      return null;
    }

    this.logStorage[reqId] = [...(this.logStorage[reqId] || []), logObject];

    return null;
  }
}
