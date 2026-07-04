#!/usr/bin/env node
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { doctor, doctorFix, hookDepsMissing, summarizeDoctor } from "../cli/lib/doctor.mjs";

const dir = mkdtempSync(join(tmpdir(), "loadout-doctor-"));
let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`❌ ${name}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

function hasMsg(list, needle) {
  return list.some((f) => f.msg.includes(needle));
}

try {
  mkdirSync(join(dir, ".claude"), { recursive: true });
  mkdirSync(join(dir, ".cursor"), { recursive: true });
  writeFileSync(
    join(dir, ".mcp.json"),
    JSON.stringify({
      mcpServers: {
        context7: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp@latest"],
          env: { CONTEXT7_API_KEY: "<your-context7-key>" },
        },
      },
    }),
  );
  writeFileSync(
    join(dir, ".cursor/mcp.json"),
    JSON.stringify({ mcpServers: { context7: { command: "npx", args: ["-y", "@upstash/context7-mcp@latest"] } } }),
  );
  writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify({}));
  writeFileSync(join(dir, ".env"), "SECRET=1\n");

  const { fix, warn, ok } = doctor(dir);

  assert("flags placeholder API key", hasMsg(fix, "CONTEXT7_API_KEY") || hasMsg(fix, "context7"));
  assert("warns duplicate context7 across agents", hasMsg(warn, 'MCP "context7" appears in'));
  assert("warns .env without protect-secrets", hasMsg(warn, "protect-secrets"));
  assert("protect-secrets warn carries catalog id", warn.some((f) => f.id === "protect-secrets"));
  assert("reports Claude MCP servers", hasMsg(ok, "MCP server(s) in .mcp.json"));
  assert("reports Cursor MCP servers", hasMsg(ok, "Cursor:"));

  const parsed = JSON.parse(JSON.stringify({
    fix,
    warn,
    ok,
    summary: { fix: fix.length, warn: warn.length, ok: ok.length },
  }));
  assert("doctor JSON shape has fix/warn/ok arrays", Array.isArray(parsed.fix) && Array.isArray(parsed.warn) && Array.isArray(parsed.ok));
  assert("doctor summary counts match arrays", parsed.summary.fix === fix.length && parsed.summary.warn === warn.length);
  const earlySum = summarizeDoctor({ fix, warn, ok, suggestions: [], domains: [], signals: [] });
  assert("summary has healthy flag", typeof earlySum.healthy === "boolean");
  assert("summary has optionalOnly flag", typeof earlySum.optionalOnly === "boolean");
  assert("placeholder key is not healthy", earlySum.healthy === false);

  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
  const profiled = doctor(dir);
  assert("doctor reports matched domains", profiled.ok.some((f) => f.msg.includes("Matched domains")));
  assert("doctor domains array includes frontend", profiled.domains.some((d) => d.id === "frontend"));
  assert("doctor signals include react", profiled.signals.includes("react"));
  assert("doctor reports detected signals", profiled.ok.some((f) => f.msg.includes("Detected signals")));
  assert("doctor suggestions is an array", Array.isArray(profiled.suggestions));
  assert("doctor suggestions include playwright for react/next", profiled.suggestions.some((s) => s.id === "playwright"));
  assert("doctor suggestions include protect-secrets when .env present", profiled.suggestions.some((s) => s.id === "protect-secrets"));
  assert("doctor does not treat builtin /code-review as a gap", !profiled.suggestions.some((s) => s.id === "code-review"));
  assert("doctor does not treat builtin /security-review as a gap", !profiled.suggestions.some((s) => s.id === "security-review"));

  const bareDir = mkdtempSync(join(tmpdir(), "loadout-doctor-bare-"));
  try {
    const bare = doctor(bareDir);
    assert("doctor still suggests /init when CLAUDE.md is missing", bare.suggestions.some((s) => s.id === "init-claude-md"));
    assert("doctor omits /code-review on bare repo too", !bare.suggestions.some((s) => s.id === "code-review"));
    if (hookDepsMissing("statusline-git").includes("jq")) {
      assert(
        "doctor skips statusline-git when jq is missing",
        !bare.suggestions.some((s) => s.id === "statusline-git"),
      );
    }
  } finally {
    rmSync(bareDir, { recursive: true, force: true });
  }

  const matureDir = mkdtempSync(join(tmpdir(), "loadout-doctor-mature-"));
  try {
    mkdirSync(join(matureDir, ".claude"), { recursive: true });
    writeFileSync(join(matureDir, "CLAUDE.md"), "# done\n");
    writeFileSync(
      join(matureDir, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          context7: { command: "npx", args: ["-y", "@upstash/context7-mcp@latest"] },
          git: { command: "uvx", args: ["mcp-server-git"] },
        },
      }),
    );
    writeFileSync(
      join(matureDir, ".claude/settings.json"),
      JSON.stringify({
        hooks: {
          Stop: [{ hooks: [{ type: "command", command: "printf '\\a' ; echo 'loadout: Claude is waiting for you.'" }] }],
          PreToolUse: [
            { matcher: "Bash", hooks: [{ type: "command", command: "echo dangerous mkfs" }] },
            { matcher: "Bash", hooks: [{ type: "command", command: "echo push directly block-push" }] },
          ],
        },
      }),
    );
    const mature = doctor(matureDir);
    assert("mature setup only suggests plugins", mature.suggestions.every((s) => s.type === "skill"));
    assert(
      "mature setup labels optional plugins",
      mature.warn.some((f) => f.msg.startsWith("Optional plugins:")),
    );
    const matureSum = summarizeDoctor(mature);
    assert("mature summary is healthy", matureSum.healthy === true);
    assert("mature summary is optionalOnly", matureSum.optionalOnly === true);
  } finally {
    rmSync(matureDir, { recursive: true, force: true });
  }

  const mcpIds = profiled.suggestions.filter((s) => s.type === "mcp").map((s) => s.id);
  assert("doctor can build applyCommandMcpOnly", mcpIds.includes("playwright"));
  const applyCmd = `npx claude-loadout apply --ids ${profiled.suggestions.map((s) => s.id).join(",")}`;
  assert("doctor can build applyCommandIds", applyCmd.includes("playwright"));

  const dry = doctorFix(dir, { mcpOnly: true, dryRun: true });
  assert("doctor --fix --dry-run lists playwright", dry.ids.includes("playwright"));
  assert("doctor --fix --dry-run does not apply", dry.applied.length === 0);
  const beforeMcp = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8"));
  assert("dry-run leaves mcp unchanged", !beforeMcp.mcpServers?.playwright);

  const hooksOnlyPreview = doctorFix(dir, { hooksOnly: true, dryRun: true });
  assert("doctor --fix --hooks-only excludes playwright", !hooksOnlyPreview.ids.includes("playwright"));
  assert("doctor --fix --hooks-only includes protect-secrets", hooksOnlyPreview.ids.includes("protect-secrets"));

  const fixed = doctorFix(dir, { mcpOnly: true });
  assert("doctor --fix applies playwright", fixed.applied.includes("playwright"));
  const afterMcp = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8"));
  assert("playwright written to .mcp.json", Boolean(afterMcp.mcpServers?.playwright?.command));
  assert("after fix, playwright not still suggested", !fixed.findings.suggestions.some((s) => s.id === "playwright"));

  const again = doctorFix(dir, { mcpOnly: true });
  assert("second --fix --mcp-only does not re-apply playwright", !again.applied.includes("playwright"));
  // Drain remaining MCP suggestions (chrome-devtools, figma, …) until none left.
  let mcpDrain = again;
  for (let i = 0; i < 5 && mcpDrain.applied.length; i++) {
    mcpDrain = doctorFix(dir, { mcpOnly: true });
  }
  assert("mcp-only fix eventually no-ops", mcpDrain.applied.length === 0);

  const hooksFix = doctorFix(dir);
  assert("doctor --fix prioritizes protect-secrets", hooksFix.applied.includes("protect-secrets"));
  assert(
    "after fix, protect-secrets warn cleared",
    !hooksFix.findings.warn.some((f) => f.id === "protect-secrets"),
  );
  assert(
    "after fix, protect-secrets not still suggested",
    !hooksFix.findings.suggestions.some((s) => s.id === "protect-secrets"),
  );

  const skillGuide = hooksFix.skills || [];
  assert("doctor --fix returns skill install guide", skillGuide.some((s) => s.id === "superpowers"));
  assert(
    "superpowers guide has install commands",
    skillGuide.find((s) => s.id === "superpowers")?.commands?.length > 0,
  );
  assert("doctor --fix skill guide omits builtins", !skillGuide.some((s) => s.id === "code-review"));

  // Dry-run with no MCP/hooks left still surfaces skill install steps.
  const guideOnly = doctorFix(dir, { dryRun: true });
  assert(
    "dry-run skill guide when skills remain",
    guideOnly.skills.some((s) => s.commands?.length || s.note),
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll doctor checks passed.");
