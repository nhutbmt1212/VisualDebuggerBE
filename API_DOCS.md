# API Endpoints Documentation

## Debug API (SDK Integration)

All endpoints require `X-API-Key` header for authentication.

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### 1. Create Session
```http
POST /api/session
Content-Type: application/json
X-API-Key: your-project-api-key

{
  "environment": "production",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1",
  "metadata": {}
}
```

#### 2. End Session
```http
PATCH /api/session/:sessionId
X-API-Key: your-project-api-key
```

#### 3. Create Events (Batch)
```http
POST /api/events
Content-Type: application/json
X-API-Key: your-project-api-key

[
  {
    "id": "uuid",
    "sessionId": "session-uuid",
    "type": "console_log",
    "timestamp": "2025-12-25T05:45:17.411Z",
    "metadata": {
      "message": "console.log",
      "data": ["Hello", "World"]
    },
    "depth": 0
  }
]
```

#### 4. Create Single Event
```http
POST /api/event
Content-Type: application/json
X-API-Key: your-project-api-key

{
  "sessionId": "session-uuid",
  "type": "FUNCTION_CALL",
  "name": "myFunction",
  "filePath": "/src/index.ts",
  "lineNumber": 10,
  "arguments": {},
  "returnValue": {},
  "duration": 100,
  "depth": 0
}
```

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "ErrorType",
  "statusCode": 400,
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```
