import { chmod, mkdir, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

const SECRETS_FILE = join(homedir(), ".harness-cli", "secrets.json");

export type ApiKeys = Record<string, string>;

function isApiKeys(value: unknown): value is ApiKeys {
  return typeof value === "object" && value !== null &&
    Object.values(value).every((key) => typeof key === "string");
}

async function restrictFilePermissions() {
  try {
    await chmod(SECRETS_FILE, 0o600);
  } catch {
    // Unix file modes are not available on every supported platform.
  }
}

export async function loadApiKeys(): Promise<ApiKeys> {
  try {
    const file = Bun.file(SECRETS_FILE);
    if (!(await file.exists())) {
      await mkdir(dirname(SECRETS_FILE), { recursive: true, mode: 0o700 });
      await Bun.write(SECRETS_FILE, "{}", { mode: 0o600 });
      await restrictFilePermissions();
      return {};
    }
    const value: unknown = await file.json();
    if (!isApiKeys(value)) return {};
    await restrictFilePermissions();
    return value;
  } catch {
    return {};
  }
}

export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  const normalizedKey = apiKey.trim();
  if (!normalizedKey) throw new Error("API key cannot be empty");

  const keys = await loadApiKeys();
  keys[provider] = normalizedKey;
  const directory = dirname(SECRETS_FILE);
  await mkdir(directory, { recursive: true, mode: 0o700 });

  const temporaryFile = join(directory, `.secrets-${randomUUID()}.tmp`);
  await Bun.write(temporaryFile, JSON.stringify(keys, null, 2), { mode: 0o600 });
  try {
    await chmod(temporaryFile, 0o600);
    await rename(temporaryFile, SECRETS_FILE);
    await restrictFilePermissions();
  } catch (error) {
    try { await Bun.file(temporaryFile).delete(); } catch { /* keep original error */ }
    throw error;
  }
}
