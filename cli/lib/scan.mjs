import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

// Walk a shallow slice of the project and collect "signals" — lowercase tokens
// (framework names, filenames, file extensions) that the catalog matches against.
export function scanProject(root = process.cwd()) {
  const signals = new Set(["always"]);
  const add = (s) => s && signals.add(String(s).toLowerCase());

  const has = (p) => existsSync(resolve(root, p));
  const read = (p) => {
    try {
      return readFileSync(resolve(root, p), "utf8");
    } catch {
      return "";
    }
  };

  // package.json + dependency names
  if (has("package.json")) {
    add("package.json");
    try {
      const pkg = JSON.parse(read("package.json"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const name of Object.keys(deps)) {
        add(name);
        // normalize a few common scoped/aliased packages to catalog signals
        if (name.includes("react")) add("react");
        if (name.startsWith("next")) add("next");
        if (name.includes("vue")) add("vue");
        if (name.includes("svelte")) add("svelte");
        if (name.includes("tailwind")) add("tailwind");
        if (name.includes("vite")) add("vite");
        if (name.includes("express")) add("express");
        if (name.includes("fastify")) add("fastify");
        if (name.includes("nest")) add("nestjs");
        if (name.includes("angular") || name.startsWith("@angular/")) add("angular");
        if (name.includes("prisma")) add("prisma");
        if (name.includes("drizzle")) add("drizzle");
        if (name.includes("playwright")) add("playwright");
        if (name.includes("prettier")) add("prettier");
        if (name.includes("expo")) add("expo");
        if (name.includes("react-native")) add("react-native");
        if (/(pg|postgres)/.test(name)) add("postgres");
        if (name.includes("stripe")) add("stripe");
        if (name.includes("sentry")) add("sentry");
        if (name.includes("supabase")) add("supabase");
        if (name.includes("mongoose") || name.includes("mongodb")) add("mongodb");
      }
    } catch {
      /* ignore malformed package.json */
    }
  }

  // Python
  if (has("requirements.txt") || has("pyproject.toml")) {
    add("python");
    if (has("requirements.txt")) add("requirements.txt");
    if (has("pyproject.toml")) add("pyproject.toml");
    const py = (read("requirements.txt") + read("pyproject.toml")).toLowerCase();
    for (const lib of ["numpy", "pandas", "torch", "tensorflow", "scikit-learn", "django", "flask", "fastapi", "ruff", "psycopg", "wandb", "mlflow", "arxiv"]) {
      if (py.includes(lib)) add(lib);
    }
  }

  // Other ecosystems
  const fileSignals = {
    "go.mod": "go.mod",
    "Cargo.toml": "Cargo.toml",
    "pom.xml": "pom.xml",
    "Gemfile": "gemfile",
    "pubspec.yaml": "pubspec.yaml",
    "Dockerfile": "dockerfile",
    "docker-compose.yml": "docker-compose",
    "docker-compose.yaml": "docker-compose",
    ".env": ".env",
    "mkdocs.yml": "mkdocs",
    "tsconfig.json": "tsconfig.json",
    "pnpm-lock.yaml": "pnpm-lock.yaml",
    "yarn.lock": "yarn.lock",
    "bun.lock": "bun.lock",
    "bun.lockb": "bun.lock",
    "uv.lock": "uv.lock",
    "angular.json": "angular",
    "nest-cli.json": "nestjs",
    "build.gradle": "build.gradle",
    "build.gradle.kts": "build.gradle",
    "Package.swift": "swift",
  };
  for (const [file, sig] of Object.entries(fileSignals)) {
    if (has(file)) add(sig);
  }
  if (has("pubspec.yaml")) {
    const pub = read("pubspec.yaml").toLowerCase();
    if (pub.includes("flutter:")) add("flutter");
  }
  for (const f of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
    if (has(f)) add("vite");
  }

  if (has(".git")) add(".git");
  if (has(".github/workflows")) add(".github/workflows");
  if (has("docs")) add("docs");
  if (isDir(root, "papers")) add("papers");
  if (isDir(root, "paper")) add("papers");
  if (has("project.godot")) add("godot");
  if (has("ProjectSettings/ProjectVersion.txt")) add("unity");

  // shallow extension sweep (top level + one dir down) for .tf / .ipynb / .xcodeproj etc.
  sweepExtensions(root, signals);

  return signals;
}

function isDir(root, rel) {
  try {
    return statSync(resolve(root, rel)).isDirectory();
  } catch {
    return false;
  }
}

function sweepExtensions(root, signals, depth = 2) {
  const skip = new Set(["node_modules", ".git", "dist", "build", ".next", "venv", ".venv", "__pycache__"]);
  const extToSignal = {
    ".tf": "terraform",
    ".ipynb": ".ipynb",
    ".tex": "latex",
    ".bib": ".bib",
    ".xcodeproj": "*.xcodeproj",
    ".swift": "swift",
    ".kt": "kotlin",
    ".uproject": "unreal",
    ".gd": "godot",
  };
  const walk = (dir, d) => {
    if (d < 0) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") && e.name !== ".github") continue;
      if (skip.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        for (const [ext, sig] of Object.entries(extToSignal)) {
          if (e.name.endsWith(ext)) addExtensionSignal(signals, ext, sig);
        }
        walk(full, d - 1);
      } else {
        for (const [ext, sig] of Object.entries(extToSignal)) {
          if (e.name.endsWith(ext)) addExtensionSignal(signals, ext, sig);
        }
      }
    }
  };
  walk(root, depth);
}

function addExtensionSignal(signals, ext, sig) {
  signals.add(sig);
  if (ext === ".ipynb") signals.add("jupyter");
}
