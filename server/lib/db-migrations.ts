import { createHash, randomUUID } from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "prisma", "migrations");
const MIGRATIONS_TABLE = "_prisma_migrations";
/** 与其它应用错开 PostgreSQL advisory lock，避免同实例多项目互抢 */
const LOCK_KEY_1 = 20260909;
const LOCK_KEY_2 = 7061;

type MigrationFile = {
  name: string;
  sql: string;
  rawSql: string;
  checksum: string;
};

type DatabaseTarget = {
  databaseUrl: string;
  adminUrl: string;
  databaseName: string;
  schemaName: string;
};

/** 与 prisma/schema.prisma 中 @@map 后的物理表名一致，用于判断是否已有旧库 */
const EXPECTED_TABLES = [
  "users",
  "languages",
  "article_bases",
  "article_contents",
  "categories",
  "tags",
  "comments",
  "media",
  "settings",
  "creators",
  "creator_applications",
  "translation_configs",
  "ai_configs",
  "article_likes",
  "article_bookmarks",
  "themes",
  "translation_logs",
  "login_logs",
  "visit_logs",
  "admin_visit_logs",
  "friend_links",
  "system_configs",
  "info_bases",
  "info_contents",
  "article_ai_generation_logs",
];

let migrationTask: Promise<void> | null = null;

/** 与 Prisma migrate 一致：SHA-256 基于 LF 归一化后的 migration.sql */
function normalizeMigrationSql(sql: string): string {
  return sql.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function sha256Hex(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** 新写入 _prisma_migrations 的 canonical checksum（LF 归一化，与 Prisma 一致） */
function getChecksum(sql: string): string {
  return sha256Hex(normalizeMigrationSql(sql));
}

/**
 * 校验已存 checksum 是否可接受（兼容线上已有库，不强制改历史记录）：
 * - 旧版 runner：对磁盘原文直接 SHA-256（常含 CRLF）
 * - Prisma CLI：对比时同时认可 LF / CRLF 两种内容
 * - 新版 runner：LF 归一化后的 SHA-256
 */
function buildMigrationChecksumCandidates(rawSql: string): Set<string> {
  const candidates = new Set<string>();
  const normalized = normalizeMigrationSql(rawSql);

  candidates.add(sha256Hex(normalized));
  candidates.add(sha256Hex(rawSql));
  candidates.add(sha256Hex(normalized.replace(/\n/g, "\r\n")));

  if (rawSql.includes("\r\n")) {
    candidates.add(sha256Hex(rawSql.replace(/\r\n/g, "\n")));
  }

  return candidates;
}

function checksumMatches(stored: string, rawSql: string): boolean {
  return buildMigrationChecksumCandidates(rawSql).has(stored);
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll(`"`, `""`)}"`;
}

function getDatabaseTarget(): DatabaseTarget {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before applying migrations.");
  }

  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  const schemaName =
    parsed.searchParams.get("schema") ||
    process.env.DATABASE_SCHEMA ||
    "public";

  const adminUrl =
    process.env.DATABASE_BOOTSTRAP_URL ||
    (() => {
      const bootstrap = new URL(databaseUrl);
      bootstrap.pathname = "/postgres";
      return bootstrap.toString();
    })();

  return {
    databaseUrl,
    adminUrl,
    databaseName,
    schemaName,
  };
}

async function readMigrationFiles(): Promise<MigrationFile[]> {
  try {
    await access(MIGRATIONS_DIR);
  } catch {
    return [];
  }

  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const migrations = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const raw = await readFile(
          path.join(MIGRATIONS_DIR, entry.name, "migration.sql"),
          "utf8",
        );

        return {
          name: entry.name,
          sql: normalizeMigrationSql(raw),
          rawSql: raw,
          checksum: getChecksum(raw),
        };
      }),
  );

  return migrations;
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      "id" TEXT PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" TEXT NOT NULL UNIQUE,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

async function ensureSchema(client: Client, schemaName: string) {
  await client.query(
    `CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schemaName)}`,
  );
  await client.query(`SET search_path TO ${quoteIdentifier(schemaName)}`);
}

async function loadAppliedMigrations(client: Client) {
  const result = await client.query<{
    migration_name: string;
    checksum: string;
  }>(
    `SELECT "migration_name", "checksum"
     FROM "${MIGRATIONS_TABLE}"
     WHERE "rolled_back_at" IS NULL`,
  );

  return new Map(
    result.rows.map((row) => [row.migration_name, row.checksum] as const),
  );
}

async function hasUserTables(client: Client) {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = ANY($1::text[])
      ) AS "exists"
    `,
    [EXPECTED_TABLES],
  );

  return Boolean(result.rows[0]?.exists);
}

/**
 * 无 _prisma_migrations 历史时，确认现有库已对齐当前 schema，才允许 baseline。
 * 特征：全部业务表存在，且含近期增量列（pinOrder / hidden / domain / ai_configs）。
 */
async function validateExistingSchemaIsLatest(client: Client) {
  const tableCountResult = await client.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS "count"
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = ANY($1::text[])
    `,
    [EXPECTED_TABLES],
  );

  const existingTableCount = Number(tableCountResult.rows[0]?.count ?? 0);
  if (existingTableCount !== EXPECTED_TABLES.length) {
    return false;
  }

  const latestMarkersResult = await client.query<{
    pin_order_exists: boolean;
    hidden_exists: boolean;
    domain_exists: boolean;
    primary_provider_exists: boolean;
  }>(`
    SELECT
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'article_bases'
          AND column_name = 'pinOrder'
      ) AS "pin_order_exists",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'info_bases'
          AND column_name = 'hidden'
      ) AS "hidden_exists",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'settings'
          AND column_name = 'domain'
      ) AS "domain_exists",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'settings'
          AND column_name = 'primaryTranslationProvider'
      ) AS "primary_provider_exists"
  `);

  const markers = latestMarkersResult.rows[0];

  return (
    Boolean(markers?.pin_order_exists) &&
    Boolean(markers?.hidden_exists) &&
    Boolean(markers?.domain_exists) &&
    Boolean(markers?.primary_provider_exists)
  );
}

async function ensureDatabaseExists(target: DatabaseTarget) {
  const probeClient = new Client({
    connectionString: target.databaseUrl,
  });

  try {
    await probeClient.connect();
    await probeClient.end();
    return;
  } catch (error: any) {
    try {
      await probeClient.end();
    } catch {
      // Ignore close errors after failed connect.
    }

    if (error?.code !== "3D000") {
      throw error;
    }
  }

  const adminClient = new Client({
    connectionString: target.adminUrl,
  });

  await adminClient.connect();
  try {
    const existsResult = await adminClient.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [target.databaseName],
    );

    if (!existsResult.rows[0]?.exists) {
      await adminClient.query(
        `CREATE DATABASE ${quoteIdentifier(target.databaseName)}`,
      );
      console.log(`[db:migrate] created database ${target.databaseName}`);
    }
  } finally {
    await adminClient.end();
  }
}

async function baselineMigrations(
  client: Client,
  migrations: MigrationFile[],
  applied: Map<string, string>,
) {
  if (applied.size > 0) {
    return;
  }

  const hasTables = await hasUserTables(client);
  if (!hasTables) {
    return;
  }

  const isLatestSchema = await validateExistingSchemaIsLatest(client);
  if (!isLatestSchema) {
    throw new Error(
      "Existing database schema detected without _prisma_migrations history, and the schema does not match the current expected version. Refusing automatic baseline to avoid duplicate execution or destructive drift.",
    );
  }

  await client.query("BEGIN");
  try {
    for (const migration of migrations) {
      await client.query(
        `INSERT INTO "${MIGRATIONS_TABLE}" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES ($1, $2, NOW(), $3, NOW(), 1)`,
        [randomUUID(), migration.checksum, migration.name],
      );
      applied.set(migration.name, migration.checksum);
    }
    await client.query("COMMIT");
    console.log("[db:migrate] baselined existing schema");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function applyPendingMigrations() {
  const target = getDatabaseTarget();

  const migrations = await readMigrationFiles();
  console.log(
    `[db:migrate] checking ${migrations.length} file(s) in ${MIGRATIONS_DIR} (database=${target.databaseName}, schema=${target.schemaName})`,
  );
  if (migrations.length < 1) {
    console.log("[db:migrate] no migration files found, skip");
    return;
  }

  await ensureDatabaseExists(target);

  const client = new Client({
    connectionString: target.databaseUrl,
  });

  await client.connect();

  try {
    await ensureSchema(client, target.schemaName);
    await client.query("SELECT pg_advisory_lock($1, $2)", [
      LOCK_KEY_1,
      LOCK_KEY_2,
    ]);
    await ensureMigrationsTable(client);

    const applied = await loadAppliedMigrations(client);
    const alreadyRecorded = applied.size;
    await baselineMigrations(client, migrations, applied);

    let appliedNow = 0;
    let alreadyPresent = 0;

    for (const migration of migrations) {
      const appliedChecksum = applied.get(migration.name);

      if (appliedChecksum) {
        if (!checksumMatches(appliedChecksum, migration.rawSql)) {
          throw new Error(
            `Migration checksum mismatch: ${migration.name}. Existing databases cannot safely apply a modified migration file.`,
          );
        }
        alreadyPresent += 1;
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO "${MIGRATIONS_TABLE}" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES ($1, $2, NOW(), $3, NOW(), 1)`,
          [randomUUID(), migration.checksum, migration.name],
        );
        await client.query("COMMIT");
        appliedNow += 1;
        console.log(`[db:migrate] applied ${migration.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    if (appliedNow === 0 && alreadyPresent === migrations.length) {
      console.log(
        `[db:migrate] schema is up to date (${migrations.length}/${migrations.length}, history=${alreadyRecorded})`,
      );
    } else {
      console.log(
        `[db:migrate] done: applied ${appliedNow}, already present ${alreadyPresent}, total ${migrations.length}`,
      );
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1, $2)", [
        LOCK_KEY_1,
        LOCK_KEY_2,
      ]);
    } catch {
      // Ignore unlock failures during shutdown/error handling.
    }
    await client.end();
  }
}

export async function ensureDatabaseMigrations() {
  if (process.env.DATABASE_AUTO_MIGRATE === "false") {
    console.log("[db:migrate] skipped (DATABASE_AUTO_MIGRATE=false)");
    return;
  }

  migrationTask ??= applyPendingMigrations();
  return migrationTask;
}
