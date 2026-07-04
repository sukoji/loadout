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
      if (pkg.workspaces) add("monorepo");
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const name of Object.keys(deps)) {
        add(name);
        // normalize a few common scoped/aliased packages to catalog signals
        if (name.includes("react")) add("react");
        if (name.startsWith("next")) add("next");
        if (name.includes("vue")) add("vue");
        if (name.includes("svelte")) add("svelte");
        if (name === "astro" || name.startsWith("@astrojs/")) add("astro");
        if (name === "remix" || name.startsWith("@remix-run/")) add("remix");
        if (name === "@sveltejs/kit") add("sveltekit");
        if (name === "nuxt" || name.startsWith("@nuxt/")) add("nuxt");
        if (name === "solid-js" || name.startsWith("@solidjs/")) add("solid");
        if (name.includes("qwik") || name.startsWith("@builder.io/qwik")) add("qwik");
        if (name.includes("tailwind")) add("tailwind");
        if (name === "vite" || (name.includes("vite") && name !== "vitepress")) add("vite");
        if (name.includes("express")) add("express");
        if (name.includes("fastify")) add("fastify");
        if (name === "hono" || name.startsWith("@hono/")) add("hono");
        if (name === "elysia" || name.startsWith("@elysiajs/")) add("elysia");
        if (name.startsWith("@trpc/") || name === "trpc") add("trpc");
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
        if (name === "redis" || name === "ioredis" || name.startsWith("@upstash/redis")) add("redis");
        if (
          name === "graphql" ||
          name.startsWith("@apollo/") ||
          name.startsWith("@graphql-tools/") ||
          name === "graphql-yoga" ||
          name.startsWith("@urql/")
        ) {
          add("graphql");
        }
        if (name.includes("docusaurus")) add("docusaurus");
        if (name === "vitepress") add("vitepress");
        if (
          name.includes("passport") ||
          name.includes("next-auth") ||
          name.includes("auth0") ||
          name.includes("openid") ||
          name.includes("oauth")
        ) {
          add("auth");
          if (name.includes("oauth")) add("oauth");
        }
        if (name.includes("jsonwebtoken") || name.includes("jose") || name === "jwt") {
          add("jwt");
          add("auth");
        }
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
  if (has("manage.py")) add("django");

  // Elixir / Phoenix
  if (has("mix.exs")) {
    add("elixir");
    const mix = read("mix.exs").toLowerCase();
    if (mix.includes("phoenix")) add("phoenix");
  }
  if (has("config/config.exs")) add("phoenix");

  // PHP / Composer
  if (has("composer.json")) {
    try {
      const composer = JSON.parse(read("composer.json"));
      const deps = { ...composer.require, ...composer["require-dev"] };
      for (const name of Object.keys(deps)) {
        if (name === "laravel/framework" || name.startsWith("laravel/")) add("laravel");
        if (name.startsWith("symfony/")) add("symfony");
      }
    } catch {
      /* ignore malformed composer.json */
    }
  }
  if (has("artisan")) add("laravel");

  // Java / Spring Boot
  if (has("pom.xml")) {
    const pom = read("pom.xml").toLowerCase();
    if (pom.includes("spring-boot")) add("spring");
  }
  for (const f of ["build.gradle", "build.gradle.kts"]) {
    if (has(f)) {
      const gradle = read(f).toLowerCase();
      if (gradle.includes("spring-boot") || gradle.includes("org.springframework.boot")) add("spring");
    }
  }
  for (const f of ["application.properties", "application.yml", "application.yaml"]) {
    if (has(f)) add("spring");
  }

  // Rust web frameworks (Cargo.toml also sets generic backend signal via fileSignals below)
  if (has("Cargo.toml")) {
    const cargo = read("Cargo.toml").toLowerCase();
    if (cargo.includes("axum")) add("axum");
    if (cargo.includes("actix")) add("actix");
  }

  // Ruby / Rails
  if (has("Gemfile")) {
    const gemfile = read("Gemfile").toLowerCase();
    if (gemfile.includes("rails")) add("rails");
  }
  if (has("config/application.rb")) add("rails");

  // Go web frameworks (go.mod also sets generic backend signal via fileSignals below)
  if (has("go.mod")) {
    const gomod = read("go.mod").toLowerCase();
    if (gomod.includes("gin-gonic/gin")) add("gin");
    if (gomod.includes("gofiber/fiber")) add("fiber");
    if (gomod.includes("labstack/echo")) add("echo");
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
    "bun.lock": "bun",
    "bun.lockb": "bun",
    "bunfig.toml": "bun",
    "uv.lock": "uv.lock",
    "deno.json": "deno",
    "deno.jsonc": "deno",
    "astro.config.mjs": "astro",
    "astro.config.ts": "astro",
    "astro.config.js": "astro",
    "remix.config.js": "remix",
    "remix.config.ts": "remix",
    "svelte.config.js": "svelte",
    "svelte.config.ts": "svelte",
    "nuxt.config.ts": "nuxt",
    "nuxt.config.js": "nuxt",
    "nuxt.config.mjs": "nuxt",
    "vitepress.config.ts": "vitepress",
    "vitepress.config.js": "vitepress",
    "vitepress.config.mjs": "vitepress",
    "angular.json": "angular",
    "nest-cli.json": "nestjs",
    "build.gradle": "build.gradle",
    "build.gradle.kts": "build.gradle",
    "Package.swift": "swift",
    "Chart.yaml": "helm",
    "Chart.yml": "helm",
    "ansible.cfg": "ansible",
    "pnpm-workspace.yaml": "monorepo",
    "turbo.json": "monorepo",
    "nx.json": "monorepo",
    "lerna.json": "monorepo",
    "rush.json": "monorepo",
  };
  for (const [file, sig] of Object.entries(fileSignals)) {
    if (has(file)) add(sig);
  }
  // Named monorepo tools (also set monorepo above).
  if (has("turbo.json")) add("turbo");
  if (has("nx.json")) add("nx");
  if (has("lerna.json")) add("lerna");
  if (has("pnpm-workspace.yaml")) add("pnpm-workspace");
  // packages/ with at least one package.json child is a common monorepo layout.
  if (isDir(root, "packages")) {
    try {
      const kids = readdirSync(resolve(root, "packages"), { withFileTypes: true });
      if (kids.some((e) => e.isDirectory() && existsSync(resolve(root, "packages", e.name, "package.json")))) {
        add("monorepo");
      }
    } catch {
      /* ignore */
    }
  }
  if (has("pubspec.yaml")) {
    const pub = read("pubspec.yaml").toLowerCase();
    if (pub.includes("flutter:")) add("flutter");
  }
  for (const f of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
    if (has(f)) add("vite");
  }
  // SvelteKit projects use svelte.config.* plus @sveltejs/kit (handled above).
  if (has("svelte.config.js") || has("svelte.config.ts")) {
    const svelteCfg = read("svelte.config.js") + read("svelte.config.ts");
    if (svelteCfg.includes("@sveltejs/kit") || svelteCfg.includes("sveltekit")) add("sveltekit");
  }

  if (has(".git")) add(".git");
  if (has(".github/workflows")) add(".github/workflows");
  if (has("docs")) add("docs");
  if (isDir(root, "papers")) add("papers");
  if (isDir(root, "paper")) add("papers");
  if (has("project.godot")) add("godot");
  if (has("ProjectSettings/ProjectVersion.txt")) add("unity");
  for (const dir of ["k8s", "kubernetes", "deploy/k8s", "manifests"]) {
    if (isDir(root, dir)) add("k8s");
  }

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
    ".docx": ".docx",
    ".xlsx": ".xlsx",
    ".graphql": "graphql",
    ".gql": "graphql",
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
