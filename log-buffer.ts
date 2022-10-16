import { prettyFactory } from "pino-pretty";

// Pino-Http attaches request context to the log object.
interface LogObject {
  reqId: string;
  level: number;
  res?: {
    statusCode: number;
  };
  req?: {
    id: string;
  };
}

const logLevelToValueMap = {
  fatal: 60,
  error: 50,
  warn: 50,
  info: 30,
  debug: 20,
  trace: 10,
};

type LogLevelName = keyof typeof logLevelToValueMap;

interface NumberRange {
  from: number;
  to: number;
}

export type LogBufferOptions = {
  logLevelOnlyOnStatus: {
    [key in LogLevelName]: {
      statusCode: number | NumberRange;
    };
  };
};

export class LogBuffer {
  logStorage: { [key: string]: { [level: number]: LogObject[] } } = {};

  options: LogBufferOptions;

  constructor(options: LogBufferOptions) {
    this.options = options;
  }

  private prettyPrinter = prettyFactory({
    colorize: true,
  });

  private shouldLogBufferedLogs(statusCode: number): LogLevelName[] {
    let toReleaseLevels: LogLevelName[] = [];

    Object.entries(this.options.logLevelOnlyOnStatus).forEach(
      ([levelName, levelOptions]) => {
        const { statusCode: levelStatusCode } = levelOptions;

        if (typeof levelStatusCode === "number") {
          if (levelStatusCode === statusCode) {
            toReleaseLevels.push(levelName as LogLevelName);
          }
        } else if (
          statusCode >= levelStatusCode.from &&
          statusCode <= levelStatusCode.to
        ) {
          toReleaseLevels.push(levelName as LogLevelName);
        }
      }
    );

    return toReleaseLevels;
  }

  private addLogToBuffer(logObject: LogObject) {
    const reqId = logObject.reqId || logObject.req?.id;

    if (!reqId) {
      return;
    }

    this.logStorage[reqId] = {
      ...this.logStorage[reqId],
      [logObject.level]: [
        ...(this.logStorage[reqId]?.[logObject.level] || []),
        logObject,
      ],
    };
  }

  private bufferedLogsExistForRequest(reqId: string) {
    return (
      this.logStorage[reqId] !== undefined &&
      typeof this.logStorage[reqId] === "object"
    );
  }

  stringifyBufferedLogs(bufferedLogs: LogObject[]): string {
    return bufferedLogs.map((log) => this.prettyPrinter(log)).join("");
  }

  processLog(logObject: LogObject): string | null {
    const reqId = logObject.reqId || logObject.req?.id;

    if (!reqId) {
      return this.prettyPrinter(logObject);
    }

    if (logObject.res) {
      const logsLevelsToRelease = this.shouldLogBufferedLogs(
        logObject.res.statusCode
      );

      if (
        logsLevelsToRelease.length &&
        this.bufferedLogsExistForRequest(reqId)
      ) {
        let logPayload = "";

        for (const logLevel of logsLevelsToRelease) {
          const bufferedLogs =
            this.logStorage[reqId]![logLevelToValueMap[logLevel]];

          if (bufferedLogs) {
            logPayload += this.stringifyBufferedLogs(bufferedLogs);
          }
        }

        return logPayload || null;
      }

      delete this.logStorage[reqId];
      return null;
    }

    this.addLogToBuffer(logObject);

    return null;
  }
}
