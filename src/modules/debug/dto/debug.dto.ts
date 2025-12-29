export interface CreateSessionDto {
  environment?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: unknown;
}

export interface CreateEventDto {
  id?: string;
  sessionId: string;
  parentEventId?: string;
  type: string;
  name?: string;
  functionName?: string;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  arguments?: unknown;
  returnValue?: unknown;
  errorMessage?: string;
  errorStack?: string;
  error?: {
    message: string;
    stack: string;
  };
  httpMethod?: string;
  httpUrl?: string;
  httpStatus?: number;
  http?: {
    method: string;
    url: string;
    statusCode?: number;
    requestBody?: unknown;
    responseBody?: unknown;
  };
  duration?: number;
  depth?: number;
  metadata?: unknown;
  timestamp?: string;
}
