import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

// Apply selected catalog items to the project config. Returns a receipt describing what happened.
export function apply(selected, root = process.cwd()) {
  const receipt = { mcp: [], settings: [], commands: [], tokens: [] };

  const mcpItems = selected.filter((i) => i.type === "mcp");
  const settingItems = selected.filter((i) => i.type === "hook" || i.type === "setting");
  const skillItems = selected.filter((i) => i.type === "skill" || i.type === "reference");

  if (mcpItems.length) {
    const path = resolve(root, ".mcp.json");
    const doc = readJson(path) || {};
    doc.mcpServers = doc.mcpServers || {};
    for (const item of mcpItems) {
      doc.mcpServers[item.id] = item.config;
      receipt.mcp.push(item.id);
      const envPlaceholder = JSON.stringify(item.config).match(/<your-[^>]+>/g);
      if (envPlaceholder) {
        receipt.tokens.push(`${item.name}: fill in ${envPlaceholder.join(", ")}`);
      } else if (item.auth) {
        receipt.tokens.push(`${item.name}: authenticates on first use`);
      }
    }
    writeJson(path, doc);
  }

  if (settingItems.length) {
    const path = resolve(root, ".claude", "settings.json");
    const doc = readJson(path) || {};
    for (const item of settingItems) {
      deepMerge(doc, item.settings);
      receipt.settings.push(item.id);
      if (item.note) receipt.tokens.push(`${item.name}: ${item.note}`);
    }
    writeJson(path, doc);
  }

  for (const item of skillItems) {
    const cmds = (item.install && item.install.commands) || [];
    if (cmds.length) {
      receipt.commands.push({ name: item.name, commands: cmds });
    } else {
      receipt.commands.push({
        name: item.name,
        commands: [],
        note: (item.install && item.install.note) || item.homepage,
      });
    }
  }

  return receipt;
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(path, doc) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
}

// Deep-merge source into target. Arrays are concatenated (so hook event arrays append,
// not replace). Objects merge recursively. Scalars from source win.
function deepMerge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (Array.isArray(val)) {
      target[key] = Array.isArray(target[key]) ? [...target[key], ...val] : [...val];
    } else if (val && typeof val === "object") {
      target[key] = target[key] && typeof target[key] === "object" ? target[key] : {};
      deepMerge(target[key], val);
    } else {
      target[key] = val;
    }
  }
  return target;
}
