-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "project" (
    "id" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(200) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" BIGSERIAL NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "actor" VARCHAR(200) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "subject_type" VARCHAR(100) NOT NULL,
    "subject_id" VARCHAR(200),
    "details" TEXT,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_event_subject_type_subject_id_idx" ON "audit_event"("subject_type", "subject_id");

-- Platform protection (ADR-0016), appended by `solidvs-data migration`: audit_event is insert-only
-- for every login, and the application login can neither change it nor the migration history.
CREATE FUNCTION "audit_event_refuse_change"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_event is insert-only';
END;
$$;

CREATE TRIGGER "audit_event_insert_only" BEFORE UPDATE OR DELETE ON "audit_event"
  FOR EACH ROW EXECUTE FUNCTION "audit_event_refuse_change"();

CREATE TRIGGER "audit_event_no_truncate" BEFORE TRUNCATE ON "audit_event"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_event_refuse_change"();

DO $$
DECLARE
  application_login text := current_database() || '_app';
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = application_login) THEN
    EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON "audit_event" FROM %I', application_login);
    EXECUTE format('REVOKE ALL ON "_prisma_migrations" FROM %I', application_login);
  END IF;
END;
$$;
