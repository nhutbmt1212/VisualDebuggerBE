export interface CreateSessionDto {
  environment?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: any;
}

export interface CreateEventDto {
  sessionId: string;
  parentEventId?: string;
  type: string;
  name?: string;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  arguments?: any;
  returnValue?: any;
  errorMessage?: string;
  errorStack?: string;
  httpMethod?: string;
  httpUrl?: string;
  httpStatus?: number;
  duration?: number;
  depth?: number;
  metadata?: any;
}
