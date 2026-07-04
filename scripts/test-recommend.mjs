#!/usr/bin/env node
// Regression checks for recommend() ranking — run before release.
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";

const catalog = loadCatalog();
// Isolate from the developer's cwd so dogfooded .mcp.json does not hide recs.
const CLEAN_ROOT = join(tmpdir(), `loadout-clean-${process.pid}`);
let failed = 0;

function assert(name, cond, detail = "") {
  if (!cond) {
    console.error(`❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
    return;
  }
  console.log(`✅ ${name}`);
}

function topNames(signals) {
  return recommend(catalog, signals, CLEAN_ROOT).items.slice(0, 8).map((e) => e.item.id);
}

// ML research repo should surface research tools, not random python marketplace plugins.
const mlResearch = new Set([
  "always",
  "requirements.txt",
  "pyproject.toml",
  "numpy",
  "pandas",
  "torch",
  ".ipynb",
  "jupyter",
  "python",
  ".git",
]);
const mlTop = topNames(mlResearch);
assert("ML research includes exa-research", mlTop.includes("exa-research"), mlTop.join(", "));
assert("ML research includes context7", mlTop.includes("context7"), mlTop.join(", "));
assert("ML research excludes aws-transform noise", !mlTop.includes("aws-transform"), mlTop.join(", "));
assert("ML research excludes mongodb by default", !mlTop.includes("mongodb"), mlTop.join(", "));

// LaTeX + bib repo should match research domain.
const paperRepo = new Set(["always", "latex", ".bib", "requirements.txt", "python"]);
const paperTop = topNames(paperRepo);
assert("Paper repo includes exa-research", paperTop.includes("exa-research"), paperTop.join(", "));
assert("Paper repo includes tavily-research", paperTop.includes("tavily-research"), paperTop.join(", "));

// Frontend repo should still prioritize browser tooling.
const frontend = new Set(["always", "package.json", "react", "next", ".git"]);
const feTop = topNames(frontend);
assert("Frontend includes playwright", feTop.includes("playwright"), feTop.join(", "));
const tailwind = new Set(["always", "package.json", "react", "tailwind", ".git"]);
assert("Tailwind includes playwright", topNames(tailwind).includes("playwright"), topNames(tailwind).join(", "));
const vite = new Set(["always", "package.json", "vite", ".git"]);
assert("Vite includes playwright", topNames(vite).includes("playwright"), topNames(vite).join(", "));
const vue = new Set(["always", "package.json", "vue", ".git"]);
assert("Vue includes playwright", topNames(vue).includes("playwright"), topNames(vue).join(", "));

const astro = new Set(["always", "package.json", "astro", ".git"]);
assert("Astro includes playwright", topNames(astro).includes("playwright"), topNames(astro).join(", "));
const remix = new Set(["always", "package.json", "remix", ".git"]);
assert("Remix includes playwright", topNames(remix).includes("playwright"), topNames(remix).join(", "));
const sveltekit = new Set(["always", "package.json", "sveltekit", "svelte", ".git"]);
assert("SvelteKit includes playwright", topNames(sveltekit).includes("playwright"), topNames(sveltekit).join(", "));
const nuxt = new Set(["always", "package.json", "nuxt", ".git"]);
assert("Nuxt includes playwright", topNames(nuxt).includes("playwright"), topNames(nuxt).join(", "));
const solid = new Set(["always", "package.json", "solid", ".git"]);
assert("Solid includes playwright", topNames(solid).includes("playwright"), topNames(solid).join(", "));
const qwik = new Set(["always", "package.json", "qwik", ".git"]);
assert("Qwik includes playwright", topNames(qwik).includes("playwright"), topNames(qwik).join(", "));
const bun = new Set(["always", "package.json", "bun", ".git"]);
assert("Bun includes playwright", topNames(bun).includes("playwright"), topNames(bun).join(", "));
const angular = new Set(["always", "package.json", "angular", ".git"]);
assert("Angular includes playwright", topNames(angular).includes("playwright"), topNames(angular).join(", "));
const deno = new Set(["always", "deno", ".git"]);
assert("Deno includes playwright", topNames(deno).includes("playwright"), topNames(deno).join(", "));
const vitepress = new Set(["always", "package.json", "vitepress", "docs", ".git"]);
assert("VitePress includes office-docs or notion", topNames(vitepress).some((id) => id === "office-docs" || id === "notion"), topNames(vitepress).join(", "));

// Jupyter + numpy research repo (LOOP #5).
const jupyterResearch = new Set([
  "always",
  "requirements.txt",
  "numpy",
  "pandas",
  ".ipynb",
  "jupyter",
  "python",
  ".git",
]);
const jrTop = topNames(jupyterResearch);
assert("Jupyter research includes exa-research", jrTop.includes("exa-research"), jrTop.join(", "));
assert("Jupyter research excludes mongodb", !jrTop.includes("mongodb"), jrTop.join(", "));
assert("Jupyter research includes fetch or firecrawl", jrTop.includes("fetch") || jrTop.includes("firecrawl"), jrTop.join(", "));

// FastAPI backend should get API-appropriate tools, not frontend noise.
const fastapi = new Set(["always", "requirements.txt", "pyproject.toml", "fastapi", "python", ".git", "postgres"]);
const beTop = topNames(fastapi);
assert("FastAPI includes context7", beTop.includes("context7"), beTop.join(", "));
assert("FastAPI includes postgres", beTop.includes("postgres"), beTop.join(", "));
assert("FastAPI includes guard-dangerous-bash", beTop.includes("guard-dangerous-bash"), beTop.join(", "));
assert("FastAPI excludes playwright", !beTop.includes("playwright"), beTop.join(", "));

const express = new Set(["always", "package.json", "express", ".git"]);
assert("Express includes context7", topNames(express).includes("context7"), topNames(express).join(", "));
assert("Express includes guard-dangerous-bash", topNames(express).includes("guard-dangerous-bash"), topNames(express).join(", "));
assert("Express excludes playwright", !topNames(express).includes("playwright"), topNames(express).join(", "));
const nestjs = new Set(["always", "package.json", "nestjs", ".git"]);
assert("NestJS includes context7", topNames(nestjs).includes("context7"), topNames(nestjs).join(", "));
assert("NestJS includes guard-dangerous-bash", topNames(nestjs).includes("guard-dangerous-bash"), topNames(nestjs).join(", "));
assert("NestJS excludes playwright", !topNames(nestjs).includes("playwright"), topNames(nestjs).join(", "));
const fastify = new Set(["always", "package.json", "fastify", ".git"]);
assert("Fastify includes context7", topNames(fastify).includes("context7"), topNames(fastify).join(", "));
assert("Fastify excludes playwright", !topNames(fastify).includes("playwright"), topNames(fastify).join(", "));
const flask = new Set(["always", "requirements.txt", "flask", "python", ".git"]);
assert("Flask includes context7", topNames(flask).includes("context7"), topNames(flask).join(", "));
assert("Flask includes guard-dangerous-bash", topNames(flask).includes("guard-dangerous-bash"), topNames(flask).join(", "));
assert("Flask excludes playwright", !topNames(flask).includes("playwright"), topNames(flask).join(", "));
const prisma = new Set(["always", "package.json", "nestjs", "prisma", "postgres", ".git"]);
assert("Prisma includes context7", topNames(prisma).includes("context7"), topNames(prisma).join(", "));
assert("Prisma includes postgres", topNames(prisma).includes("postgres"), topNames(prisma).join(", "));
assert("Prisma excludes playwright", !topNames(prisma).includes("playwright"), topNames(prisma).join(", "));
const drizzle = new Set(["always", "package.json", "drizzle", "postgres", ".git"]);
assert("Drizzle includes context7", topNames(drizzle).includes("context7"), topNames(drizzle).join(", "));
assert("Drizzle includes postgres", topNames(drizzle).includes("postgres"), topNames(drizzle).join(", "));
assert("Drizzle excludes playwright", !topNames(drizzle).includes("playwright"), topNames(drizzle).join(", "));
const supabase = new Set(["always", "package.json", "supabase", "postgres", ".git"]);
assert("Supabase includes context7", topNames(supabase).includes("context7"), topNames(supabase).join(", "));
assert("Supabase includes supabase mcp", topNames(supabase).includes("supabase"), topNames(supabase).join(", "));
assert("Supabase excludes playwright", !topNames(supabase).includes("playwright"), topNames(supabase).join(", "));
const mongodb = new Set(["always", "package.json", "express", "mongoose", "mongodb", ".git"]);
assert("MongoDB includes context7", topNames(mongodb).includes("context7"), topNames(mongodb).join(", "));
assert("MongoDB includes mongodb mcp", topNames(mongodb).includes("mongodb"), topNames(mongodb).join(", "));
assert("MongoDB excludes playwright", !topNames(mongodb).includes("playwright"), topNames(mongodb).join(", "));
const sentry = new Set(["always", "package.json", "express", "sentry", ".git"]);
assert("Sentry includes context7", topNames(sentry).includes("context7"), topNames(sentry).join(", "));
assert("Sentry includes sentry mcp", topNames(sentry).includes("sentry"), topNames(sentry).join(", "));
assert("Sentry excludes playwright", !topNames(sentry).includes("playwright"), topNames(sentry).join(", "));

const hono = new Set(["always", "package.json", "hono", ".git"]);
const honoTop = topNames(hono);
assert("Hono includes context7", honoTop.includes("context7"), honoTop.join(", "));
assert("Hono includes guard-dangerous-bash", honoTop.includes("guard-dangerous-bash"), honoTop.join(", "));
assert("Hono excludes playwright", !honoTop.includes("playwright"), honoTop.join(", "));
const elysia = new Set(["always", "package.json", "elysia", ".git"]);
assert("Elysia includes context7", topNames(elysia).includes("context7"), topNames(elysia).join(", "));
const trpc = new Set(["always", "package.json", "trpc", ".git"]);
assert("tRPC includes context7", topNames(trpc).includes("context7"), topNames(trpc).join(", "));
const graphql = new Set(["always", "package.json", "graphql", ".git"]);
assert("GraphQL includes context7", topNames(graphql).includes("context7"), topNames(graphql).join(", "));
assert("GraphQL excludes playwright", !topNames(graphql).includes("playwright"), topNames(graphql).join(", "));
const redis = new Set(["always", "package.json", "redis", ".git"]);
assert("Redis includes context7", topNames(redis).includes("context7"), topNames(redis).join(", "));
assert("Redis excludes playwright", !topNames(redis).includes("playwright"), topNames(redis).join(", "));
const laravel = new Set(["always", "laravel", "symfony", ".git"]);
assert("Laravel includes context7", topNames(laravel).includes("context7"), topNames(laravel).join(", "));
assert("Laravel includes guard-dangerous-bash", topNames(laravel).includes("guard-dangerous-bash"), topNames(laravel).join(", "));
assert("Laravel excludes playwright", !topNames(laravel).includes("playwright"), topNames(laravel).join(", "));
const spring = new Set(["always", "spring", "pom.xml", ".git"]);
assert("Spring includes context7", topNames(spring).includes("context7"), topNames(spring).join(", "));
assert("Spring includes guard-dangerous-bash", topNames(spring).includes("guard-dangerous-bash"), topNames(spring).join(", "));
assert("Spring excludes playwright", !topNames(spring).includes("playwright"), topNames(spring).join(", "));
const axum = new Set(["always", "axum", "Cargo.toml", ".git"]);
assert("Axum includes context7", topNames(axum).includes("context7"), topNames(axum).join(", "));
assert("Axum excludes playwright", !topNames(axum).includes("playwright"), topNames(axum).join(", "));
const actix = new Set(["always", "actix", "Cargo.toml", ".git"]);
assert("Actix includes context7", topNames(actix).includes("context7"), topNames(actix).join(", "));
assert("Actix excludes playwright", !topNames(actix).includes("playwright"), topNames(actix).join(", "));
const django = new Set(["always", "django", "requirements.txt", "python", ".git"]);
assert("Django includes context7", topNames(django).includes("context7"), topNames(django).join(", "));
assert("Django includes guard-dangerous-bash", topNames(django).includes("guard-dangerous-bash"), topNames(django).join(", "));
assert("Django excludes playwright", !topNames(django).includes("playwright"), topNames(django).join(", "));
const phoenix = new Set(["always", "phoenix", "elixir", ".git"]);
assert("Phoenix includes context7", topNames(phoenix).includes("context7"), topNames(phoenix).join(", "));
assert("Phoenix includes guard-dangerous-bash", topNames(phoenix).includes("guard-dangerous-bash"), topNames(phoenix).join(", "));
assert("Phoenix excludes playwright", !topNames(phoenix).includes("playwright"), topNames(phoenix).join(", "));
const rails = new Set(["always", "rails", ".git"]);
assert("Rails includes context7", topNames(rails).includes("context7"), topNames(rails).join(", "));
assert("Rails includes guard-dangerous-bash", topNames(rails).includes("guard-dangerous-bash"), topNames(rails).join(", "));
assert("Rails excludes playwright", !topNames(rails).includes("playwright"), topNames(rails).join(", "));
const gin = new Set(["always", "gin", "go.mod", ".git"]);
assert("Gin includes context7", topNames(gin).includes("context7"), topNames(gin).join(", "));
assert("Gin excludes playwright", !topNames(gin).includes("playwright"), topNames(gin).join(", "));
const fiber = new Set(["always", "fiber", "go.mod", ".git"]);
assert("Fiber includes context7", topNames(fiber).includes("context7"), topNames(fiber).join(", "));
assert("Fiber excludes playwright", !topNames(fiber).includes("playwright"), topNames(fiber).join(", "));
const echo = new Set(["always", "echo", "go.mod", ".git"]);
assert("Echo includes context7", topNames(echo).includes("context7"), topNames(echo).join(", "));
assert("Echo excludes playwright", !topNames(echo).includes("playwright"), topNames(echo).join(", "));

// Godot game project.
const godot = new Set(["always", "godot", "project.godot", ".git"]);
const gdTop = topNames(godot);
assert("Godot includes context7", gdTop.includes("context7"), gdTop.join(", "));
assert("Godot includes guard-dangerous-bash", gdTop.includes("guard-dangerous-bash"), gdTop.join(", "));
const unity = new Set(["always", "unity", ".git"]);
assert("Unity includes context7", topNames(unity).includes("context7"), topNames(unity).join(", "));
assert("Unity includes guard-dangerous-bash", topNames(unity).includes("guard-dangerous-bash"), topNames(unity).join(", "));
const unreal = new Set(["always", "unreal", ".git"]);
assert("Unreal includes context7", topNames(unreal).includes("context7"), topNames(unreal).join(", "));
assert("Unreal includes guard-dangerous-bash", topNames(unreal).includes("guard-dangerous-bash"), topNames(unreal).join(", "));

// Flutter / mobile.
const flutter = new Set(["always", "pubspec.yaml", "flutter", "build.gradle", ".git"]);
const flTop = topNames(flutter);
assert("Flutter includes context7", flTop.includes("context7"), flTop.join(", "));
assert("Flutter includes figma or playwright", flTop.includes("figma") || flTop.includes("playwright"), flTop.join(", "));

// Expo / React Native.
const expo = new Set(["always", "package.json", "expo", "react-native", ".git"]);
const expoTop = topNames(expo);
assert("Expo includes context7", expoTop.includes("context7"), expoTop.join(", "));
assert("Expo excludes postgres by default", !expoTop.includes("postgres"), expoTop.join(", "));

// DevOps / infra.
const devops = new Set(["always", "dockerfile", "terraform", "helm", "k8s", ".github/workflows", ".git"]);
const dvTop = topNames(devops);
assert("DevOps includes git or github", dvTop.includes("git") || dvTop.includes("github"), dvTop.join(", "));
assert("DevOps includes guard-dangerous-bash", dvTop.includes("guard-dangerous-bash"), dvTop.join(", "));
assert("DevOps excludes playwright", !dvTop.includes("playwright"), dvTop.join(", "));

// Docs / writing.
const docsWriting = new Set(["always", "docs", "mkdocs", "docusaurus", ".docx"]);
const docsTop = topNames(docsWriting);
assert("Docs includes office-docs or notion", docsTop.includes("office-docs") || docsTop.includes("notion"), docsTop.join(", "));
assert("Docs excludes postgres by default", !docsTop.includes("postgres"), docsTop.join(", "));

// Security-sensitive (auth/payments).
const security = new Set(["always", "auth", "jwt", "stripe", ".env", ".git"]);
const secTop = topNames(security);
assert("Security includes protect-secrets", secTop.includes("protect-secrets"), secTop.join(", "));
assert("Security includes guard-dangerous-bash", secTop.includes("guard-dangerous-bash"), secTop.join(", "));
assert("Security includes stripe mcp", secTop.includes("stripe"), secTop.join(", "));

// protect-secrets requires .env — do not push it on plain devops repos.
const devopsNoEnv = new Set(["always", "dockerfile", "terraform", ".github/workflows", ".git"]);
const devopsNoEnvTop = topNames(devopsNoEnv);
assert("DevOps without .env excludes protect-secrets", !devopsNoEnvTop.includes("protect-secrets"), devopsNoEnvTop.join(", "));

// Monorepo markers match devops tooling (filesystem / git / github).
const monorepo = new Set(["always", "monorepo", "turbo", "package.json", ".git"]);
const monoTop = topNames(monorepo);
assert("Monorepo includes filesystem or git", monoTop.includes("filesystem") || monoTop.includes("git"), monoTop.join(", "));
assert("Monorepo includes github or git", monoTop.includes("github") || monoTop.includes("git"), monoTop.join(", "));

// .env alone (via general loadout) surfaces protect-secrets even when security isn't top domain.
const frontendEnv = new Set(["always", "react", "next", "package.json", ".env"]);
const frontendEnvTop = topNames(frontendEnv);
assert("Frontend with .env includes protect-secrets", frontendEnvTop.includes("protect-secrets"), frontendEnvTop.join(", "));
assert("Frontend without .env excludes protect-secrets", !topNames(new Set(["always", "react", "next", "package.json"])).includes("protect-secrets"));

const officialInPool = recommend(catalog, mlResearch, CLEAN_ROOT).items.filter((e) => e.item.tier === "official").length;
assert("Official tier capped in pool", officialInPool <= 2, String(officialInPool));

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll recommend checks passed.");
