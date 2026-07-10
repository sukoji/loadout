import { spawnSync } from "node:child_process";

// Run through a shell (so the `claude` .cmd shim resolves on Windows), passing the whole command as
// one string to avoid the args+shell injection footgun (DEP0190). Inputs come only from the trusted
// catalog, and we still reject shell metacharacters as defense-in-depth.
const UNSAFE = /[;&|`$(){}<>\n\r\\]/;
function sh(cmd) {
  return spawnSync(cmd, { encoding: "utf8", shell: true });
}

function claudeAvailable() {
  try {
    return sh("claude --version").status === 0;
  } catch {
    return false;
  }
}

// Translate a "/plugin marketplace add X" slash command into the `claude plugin …` CLI form and run it.
function runPluginCommand(slash) {
  const rest = slash.replace(/^\/plugin\s+/, "").trim();
  if (!rest || UNSAFE.test(rest)) return { ok: false, out: "empty or unsafe command" };
  const r = sh(`claude plugin ${rest}`);
  return { ok: r.status === 0, out: `${r.stdout || ""}${r.stderr || ""}`.trim() };
}

// Actually install the selected plugin-type skills via the Claude Code CLI.
// Only touches items that install via a marketplace plugin; never community/unverified items.
export function installSelected(items) {
  const plugins = items.filter(
    (i) =>
      (i.type === "skill" || i.type === "reference") &&
      i.install?.type === "plugin" &&
      (i.install.commands || []).length &&
      i.tier !== "community",
  );
  if (!plugins.length) return { ran: false, results: [], plugins };
  if (!claudeAvailable()) return { ran: false, results: [], plugins, reason: "claude-cli-missing" };

  const results = [];
  for (const item of plugins) {
    let ok = true;
    let log = "";
    for (const cmd of item.install.commands) {
      const r = runPluginCommand(cmd);
      log += `${cmd} → ${r.ok ? "ok" : "FAILED"}\n`;
      if (!r.ok) {
        ok = false;
        log += r.out ? `  ${r.out.split("\n").slice(-1)[0]}\n` : "";
        break;
      }
    }
    results.push({ name: item.name, id: item.id, ok, log: log.trim() });
  }
  return { ran: true, results, plugins };
}
