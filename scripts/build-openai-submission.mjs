#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pkg = JSON.parse(run("git", ["show", "HEAD:package.json"]).stdout);

const dirty = spawnSync("git", ["diff", "--quiet", "HEAD", "--", "plugins/loadout"], { cwd: root });
if (dirty.status !== 0) {
  console.error("❌ Commit plugin changes before building so the archive cannot be stale.");
  process.exit(1);
}

mkdirSync(join(root, "dist"), { recursive: true });
const output = join(root, "dist", `loadout-openai-submission-v${pkg.version}.zip`);
run("git", ["archive", "--format=zip", "--prefix=loadout/", `--output=${relative(root, output)}`, "HEAD:plugins/loadout"]);

console.log(`✅ OpenAI skills-only archive: ${output}`);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
  return result;
}
