import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const CONFIG_FILE = join(homedir(), ".harness-cli", "config.json");

export type Config = {
  model: string;
  provider: string;
};

const DEFAULT_CONFIG: Config = {
  model: "qwen/qwen3.8-27b",
  provider: "groq",
};

export async function getConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_FILE);

    if (!(await file.exists())) {
      await mkdir(dirname(CONFIG_FILE), { recursive: true });
      await Bun.write(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));

      return DEFAULT_CONFIG;
    }

    return await file.json();
  } catch (err) {
    console.error("Failed to load config:", err);
    return DEFAULT_CONFIG;
  }
}

export async function configFileExists(): Promise<boolean> {
  return Bun.file(CONFIG_FILE).exists();
}

export async function saveConfig(config: Partial<Config>) {  
  const file = structuredClone(await Bun.file(CONFIG_FILE).json());
  Object.keys(file).forEach((k) => {
    const key = k as keyof Config;
    if (config[key]) {
      file[k] = config[key]
    }
  })
  await mkdir(dirname(CONFIG_FILE), { recursive: true });
  await Bun.write(
    CONFIG_FILE,
    JSON.stringify(file, null, 2)
  );
}


export async function log(log: string) {
    const file = Bun.file("./logs.txt");
    let d = await file.text();
    d += `\n[${new Date().toISOString()}]: ${log}`
    await file.write(d);
}
