BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[project] (
    [id] NVARCHAR(60) NOT NULL,
    [name] NVARCHAR(120) NOT NULL,
    [created_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(200) NOT NULL,
    CONSTRAINT [project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_event] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [occurred_at] DATETIME2 NOT NULL,
    [actor] NVARCHAR(200) NOT NULL,
    [action] NVARCHAR(100) NOT NULL,
    [subject_type] NVARCHAR(100) NOT NULL,
    [subject_id] NVARCHAR(200),
    [details] NVARCHAR(max),
    CONSTRAINT [audit_event_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_event_subject_type_subject_id_idx] ON [dbo].[audit_event]([subject_type], [subject_id]);

-- Platform protection (ADR-0016), appended by `solidvs-data migration`: audit_event is insert-only
-- for every login, and the application user can neither change it nor the migration history.
EXEC('CREATE TRIGGER [dbo].[audit_event_insert_only] ON [dbo].[audit_event] INSTEAD OF UPDATE, DELETE AS BEGIN SET NOCOUNT ON; THROW 50001, ''audit_event is insert-only'', 1; END');

IF DATABASE_PRINCIPAL_ID('app') IS NOT NULL
BEGIN
    DENY UPDATE, DELETE ON [dbo].[audit_event] TO [app];
    DENY SELECT, INSERT, UPDATE, DELETE ON [dbo].[_prisma_migrations] TO [app];
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

