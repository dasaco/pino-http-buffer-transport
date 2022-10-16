// Pino-Http attaches request context to the log object.
export interface LogObject {
  reqId: string;
  level: number;
  res?: {
    statusCode: number;
  };
  req?: {
    id: string;
  };
}

export const logLevelToValueMap = {
  fatal: 60,
  error: 50,
  warn: 50,
  info: 30,
  debug: 20,
  trace: 10,
};

export type LogLevelName = keyof typeof logLevelToValueMap;

export interface NumberRange {
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
