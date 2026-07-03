import { homedir } from "node:os";
import { resolve } from "node:path";

export function openclawHome() {
  return process.env.LOADOUT_OPENCLAW_HOME || homedir();
}

export function openclawConfigPath() {
  return resolve(openclawHome(), ".openclaw/openclaw.json");
}
