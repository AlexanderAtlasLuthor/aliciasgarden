#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEV_VARS_PATH = path.join(repoRoot, 'apps', 'worker', '.dev.vars');
const MIGRATIONS_DIR = path.join(repoRoot, 'supabase', 'migrations');
const BUCKET_NAME = 'plant-photos';

function logStep(message) {
  console.log(`[bootstrap] ${message}`);
}

function formatSupabaseHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return '<invalid-url>';
  }
}

function getProjectRefFromSupabaseUrl(url) {
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function buildSupabaseDbUrl({ supabaseUrl, dbPassword }) {
  const projectRef = getProjectRefFromSupabaseUrl(supabaseUrl);
  if (!projectRef || !dbPassword) return null;

  const encodedPassword = encodeURIComponent(dbPassword);
  return `postgres://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
}

function parseDotEnvContent(content) {
  const out = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return undefined;
}

async function loadConfig() {
  let fileVars = {};

  try {
    const content = await readFile(DEV_VARS_PATH, 'utf8');
    fileVars = parseDotEnvContent(content);
    logStep(`Loaded vars from ${path.relative(repoRoot, DEV_VARS_PATH)}.`);
  } catch {
    logStep('No apps/worker/.dev.vars file found, using only process env.');
  }

  const supabaseUrl = firstNonEmpty(process.env.SUPABASE_URL, fileVars.SUPABASE_URL);
  const serviceRoleKey = firstNonEmpty(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    fileVars.SUPABASE_SERVICE_ROLE_KEY
  );
  const dbUrlFromEnv = firstNonEmpty(process.env.SUPABASE_DB_URL, fileVars.SUPABASE_DB_URL);
  const dbPassword = firstNonEmpty(
    process.env.SUPABASE_DB_PASSWORD,
    fileVars.SUPABASE_DB_PASSWORD,
    process.env.SUPABASE_DB_PASS,
    fileVars.SUPABASE_DB_PASS
  );

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in env or apps/worker/.dev.vars.'
    );
  }

  logStep(`SUPABASE host: ${formatSupabaseHost(supabaseUrl)}`);
  logStep('SUPABASE_SERVICE_ROLE_KEY: loaded.');

  let dbUrl = dbUrlFromEnv;
  if (!dbUrl) {
    dbUrl = buildSupabaseDbUrl({ supabaseUrl, dbPassword });
    if (dbUrl) {
      logStep('SUPABASE_DB_URL: auto-constructed from SUPABASE_URL and DB password var.');
    }
  }

  if (dbUrl) {
    logStep('SUPABASE_DB_URL: configured.');
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    serviceRoleKey,
    dbUrl,
    hasDbPassword: Boolean(dbPassword),
  };
}

function getMissingPsqlConfigError(config) {
  if (!config.hasDbPassword) {
    return [
      'Cannot apply migrations: /pg/v1/query is unavailable and missing SUPABASE_DB_PASSWORD (or SUPABASE_DB_PASS).',
      'Add one of these lines to apps/worker/.dev.vars:',
      'SUPABASE_DB_PASSWORD=your-db-password',
      'SUPABASE_DB_PASS=your-db-password',
      'Or set SUPABASE_DB_URL directly.',
    ].join('\n');
  }

  return [
    'Cannot apply migrations: /pg/v1/query is unavailable and SUPABASE_DB_URL is not set.',
    'Tried auto-build with SUPABASE_URL + DB password but could not derive db.<project-ref>.supabase.co.',
    'Set SUPABASE_DB_URL directly in apps/worker/.dev.vars.',
  ].join('\n');
}

async function listMigrationFiles() {
  const files = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const migrationFiles = files
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (migrationFiles.length === 0) {
    throw new Error(`No migration .sql files found in ${path.relative(repoRoot, MIGRATIONS_DIR)}.`);
  }

  return migrationFiles;
}

async function executeSqlOverHttp({ supabaseUrl, serviceRoleKey, sql, migrationName }) {
  const endpoint = `${supabaseUrl}/pg/v1/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.status === 404 || response.status === 405) {
    return { unsupported: true };
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `SQL HTTP failed for ${migrationName} with status ${response.status}: ${body.slice(0, 500)}`
    );
  }

  return { unsupported: false };
}

function runPsql({ dbUrl, filePath, migrationName }) {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', ['-v', 'ON_ERROR_STOP=1', dbUrl, '-f', filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start psql for ${migrationName}: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `psql failed for ${migrationName} with exit code ${String(code)}: ${stderr.slice(0, 500)}`
        )
      );
    });
  });
}

async function applyMigrations(config, migrationFiles) {
  logStep(`Applying ${migrationFiles.length} migration(s) in lexical order.`);

  let useHttp = true;

  for (const migrationName of migrationFiles) {
    const migrationPath = path.join(MIGRATIONS_DIR, migrationName);
    const sql = await readFile(migrationPath, 'utf8');

    if (useHttp) {
      logStep(`Applying ${migrationName} via HTTP SQL endpoint...`);
      const result = await executeSqlOverHttp({
        supabaseUrl: config.supabaseUrl,
        serviceRoleKey: config.serviceRoleKey,
        sql,
        migrationName,
      });

      if (!result.unsupported) {
        logStep(`Applied ${migrationName}.`);
        continue;
      }

      useHttp = false;
      logStep('HTTP SQL endpoint not available; attempting psql fallback.');
    }

    if (!config.dbUrl) {
      throw new Error(getMissingPsqlConfigError(config));
    }

    logStep(`Applying ${migrationName} via psql...`);
    await runPsql({ dbUrl: config.dbUrl, filePath: migrationPath, migrationName });
    logStep(`Applied ${migrationName}.`);
  }
}

async function ensureBucket({ supabaseUrl, serviceRoleKey }) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  const bucketUrl = `${supabaseUrl}/storage/v1/bucket/${BUCKET_NAME}`;
  const desired = {
    id: BUCKET_NAME,
    name: BUCKET_NAME,
    public: false,
    file_size_limit: 8388608,
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
  };

  logStep(`Ensuring bucket '${BUCKET_NAME}' exists and is private.`);

  const getResponse = await fetch(bucketUrl, { method: 'GET', headers });

  if (getResponse.status === 404) {
    const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: JSON.stringify(desired),
    });

    if (createResponse.status === 409) {
      logStep(`Bucket '${BUCKET_NAME}' already exists (race detected).`);
    } else if (!createResponse.ok) {
      const body = await createResponse.text();
      throw new Error(`Bucket create failed (${createResponse.status}): ${body.slice(0, 500)}`);
    } else {
      logStep(`Bucket '${BUCKET_NAME}' created.`);
      return;
    }
  }

  if (!getResponse.ok) {
    const body = await getResponse.text();
    throw new Error(`Bucket read failed (${getResponse.status}): ${body.slice(0, 500)}`);
  }

  const current = await getResponse.json();
  const needsUpdate =
    current.public !== desired.public ||
    current.file_size_limit !== desired.file_size_limit ||
    JSON.stringify([...(current.allowed_mime_types ?? [])].sort()) !==
      JSON.stringify([...desired.allowed_mime_types].sort());

  if (!needsUpdate) {
    logStep(`Bucket '${BUCKET_NAME}' already configured.`);
    return;
  }

  const updateResponse = await fetch(bucketUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      public: desired.public,
      file_size_limit: desired.file_size_limit,
      allowed_mime_types: desired.allowed_mime_types,
    }),
  });

  if (!updateResponse.ok) {
    const body = await updateResponse.text();
    throw new Error(`Bucket update failed (${updateResponse.status}): ${body.slice(0, 500)}`);
  }

  logStep(`Bucket '${BUCKET_NAME}' updated to desired configuration.`);
}

async function main() {
  const config = await loadConfig();
  const migrationFiles = await listMigrationFiles();
  await applyMigrations(config, migrationFiles);
  await ensureBucket(config);

  logStep('Bootstrap finished successfully.');
  logStep('Verification SQL (run in Supabase SQL editor):');
  logStep("  select to_regclass('public.plant_photos') is not null as plant_photos_exists;");
  logStep("  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='plants' and column_name='cover_photo_path') as cover_photo_path_exists;");
  logStep('Verification Storage API:');
  logStep(`  GET ${config.supabaseUrl}/storage/v1/bucket/${BUCKET_NAME}`);
}

main().catch((error) => {
  console.error(`[bootstrap] ERROR: ${error.message}`);
  process.exitCode = 1;
});
