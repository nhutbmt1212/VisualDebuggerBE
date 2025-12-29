-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "api_key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debug_sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "user_agent" TEXT,
    "ip_address" TEXT,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "debug_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debug_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "parent_event_id" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "file_path" TEXT,
    "line_number" INTEGER,
    "column_number" INTEGER,
    "arguments" JSONB,
    "return_value" JSONB,
    "error_message" TEXT,
    "error_stack" TEXT,
    "http_method" TEXT,
    "http_url" TEXT,
    "http_status" INTEGER,
    "http_request" JSONB,
    "http_response" JSONB,
    "duration" INTEGER,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debug_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_api_key_key" ON "projects"("api_key");

-- CreateIndex
CREATE INDEX "debug_sessions_project_id_idx" ON "debug_sessions"("project_id");

-- CreateIndex
CREATE INDEX "debug_sessions_started_at_idx" ON "debug_sessions"("started_at");

-- CreateIndex
CREATE INDEX "debug_events_session_id_idx" ON "debug_events"("session_id");

-- CreateIndex
CREATE INDEX "debug_events_timestamp_idx" ON "debug_events"("timestamp");

-- CreateIndex
CREATE INDEX "debug_events_type_idx" ON "debug_events"("type");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debug_sessions" ADD CONSTRAINT "debug_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debug_events" ADD CONSTRAINT "debug_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "debug_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debug_events" ADD CONSTRAINT "debug_events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "debug_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
