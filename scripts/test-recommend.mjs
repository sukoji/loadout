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
const wandbResearch = new Set(["always", "wandb", "requirements.txt", "python", ".ipynb", "jupyter", ".git"]);
const wandbTop = topNames(wandbResearch);
assert("W&B research includes exa-research", wandbTop.includes("exa-research"), wandbTop.join(", "));
assert("W&B research excludes playwright", !wandbTop.includes("playwright"), wandbTop.join(", "));
const mlflowResearch = new Set(["always", "mlflow", "requirements.txt", "python", ".ipynb", "jupyter", ".git"]);
const mlflowTop = topNames(mlflowResearch);
assert("MLflow research includes exa-research", mlflowTop.includes("exa-research"), mlflowTop.join(", "));
assert("MLflow research excludes playwright", !mlflowTop.includes("playwright"), mlflowTop.join(", "));
const arxivResearch = new Set(["always", "arxiv", "requirements.txt", "python", ".ipynb", "jupyter", ".git"]);
const arxivTop = topNames(arxivResearch);
assert("arxiv research includes exa-research", arxivTop.includes("exa-research"), arxivTop.join(", "));
assert("arxiv research includes tavily-research", arxivTop.includes("tavily-research"), arxivTop.join(", "));
assert("arxiv research excludes playwright", !arxivTop.includes("playwright"), arxivTop.join(", "));

// Frontend repo should still prioritize browser tooling.
const frontend = new Set(["always", "package.json", "react", "next", ".git"]);
const feTop = topNames(frontend);
assert("Frontend includes playwright", feTop.includes("playwright"), feTop.join(", "));
assert("Next.js includes chrome-devtools", feTop.includes("chrome-devtools"), feTop.join(", "));
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
const svelte = new Set(["always", "package.json", "svelte", ".git"]);
assert("Svelte includes playwright", topNames(svelte).includes("playwright"), topNames(svelte).join(", "));
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

const torchMl = new Set(["always", "requirements.txt", "torch", "numpy", "python", ".git"]);
const torchTop = topNames(torchMl);
assert("Torch data-ml includes context7", torchTop.includes("context7"), torchTop.join(", "));
assert("Torch data-ml excludes playwright", !torchTop.includes("playwright"), torchTop.join(", "));
assert("Torch data-ml excludes mongodb", !torchTop.includes("mongodb"), torchTop.join(", "));
const tensorflowMl = new Set(["always", "requirements.txt", "tensorflow", "numpy", "python", ".git"]);
const tfTop = topNames(tensorflowMl);
assert("TensorFlow data-ml includes context7", tfTop.includes("context7"), tfTop.join(", "));
assert("TensorFlow data-ml excludes playwright", !tfTop.includes("playwright"), tfTop.join(", "));
assert("TensorFlow data-ml excludes mongodb", !tfTop.includes("mongodb"), tfTop.join(", "));
const sklearnMl = new Set(["always", "requirements.txt", "scikit-learn", "numpy", "python", ".git"]);
const skTop = topNames(sklearnMl);
assert("scikit-learn data-ml includes context7", skTop.includes("context7"), skTop.join(", "));
assert("scikit-learn data-ml excludes playwright", !skTop.includes("playwright"), skTop.join(", "));
assert("scikit-learn data-ml excludes mongodb", !skTop.includes("mongodb"), skTop.join(", "));
const pandasMl = new Set(["always", "requirements.txt", "pandas", "numpy", "python", ".git"]);
const pdTop = topNames(pandasMl);
assert("pandas data-ml includes context7", pdTop.includes("context7"), pdTop.join(", "));
assert("pandas data-ml excludes playwright", !pdTop.includes("playwright"), pdTop.join(", "));
assert("pandas data-ml excludes mongodb", !pdTop.includes("mongodb"), pdTop.join(", "));
const uvMl = new Set(["always", "uv.lock", "pyproject.toml", "numpy", "python", ".git"]);
const uvTop = topNames(uvMl);
assert("uv data-ml includes context7", uvTop.includes("context7"), uvTop.join(", "));
assert("uv data-ml excludes playwright", !uvTop.includes("playwright"), uvTop.join(", "));
assert("uv data-ml excludes mongodb", !uvTop.includes("mongodb"), uvTop.join(", "));
const pyprojectMl = new Set(["always", "pyproject.toml", "numpy", "python", ".git"]);
const pyTop = topNames(pyprojectMl);
assert("pyproject data-ml includes context7", pyTop.includes("context7"), pyTop.join(", "));
assert("pyproject data-ml excludes playwright", !pyTop.includes("playwright"), pyTop.join(", "));
assert("pyproject data-ml excludes mongodb", !pyTop.includes("mongodb"), pyTop.join(", "));

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
const fastifyTop = topNames(fastify);
assert("Fastify includes context7", fastifyTop.includes("context7"), fastifyTop.join(", "));
assert("Fastify includes guard-dangerous-bash", fastifyTop.includes("guard-dangerous-bash"), fastifyTop.join(", "));
assert("Fastify excludes playwright", !fastifyTop.includes("playwright"), fastifyTop.join(", "));
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
const elysiaTop = topNames(elysia);
assert("Elysia includes context7", elysiaTop.includes("context7"), elysiaTop.join(", "));
assert("Elysia includes guard-dangerous-bash", elysiaTop.includes("guard-dangerous-bash"), elysiaTop.join(", "));
assert("Elysia excludes playwright", !elysiaTop.includes("playwright"), elysiaTop.join(", "));
const trpc = new Set(["always", "package.json", "trpc", ".git"]);
const trpcTop = topNames(trpc);
assert("tRPC includes context7", trpcTop.includes("context7"), trpcTop.join(", "));
assert("tRPC includes guard-dangerous-bash", trpcTop.includes("guard-dangerous-bash"), trpcTop.join(", "));
assert("tRPC excludes playwright", !trpcTop.includes("playwright"), trpcTop.join(", "));
const graphql = new Set(["always", "package.json", "graphql", ".git"]);
const graphqlTop = topNames(graphql);
assert("GraphQL includes context7", graphqlTop.includes("context7"), graphqlTop.join(", "));
assert("GraphQL includes guard-dangerous-bash", graphqlTop.includes("guard-dangerous-bash"), graphqlTop.join(", "));
assert("GraphQL excludes playwright", !graphqlTop.includes("playwright"), graphqlTop.join(", "));
const redis = new Set(["always", "package.json", "redis", ".git"]);
const redisTop = topNames(redis);
assert("Redis includes context7", redisTop.includes("context7"), redisTop.join(", "));
assert("Redis includes guard-dangerous-bash", redisTop.includes("guard-dangerous-bash"), redisTop.join(", "));
assert("Redis excludes playwright", !redisTop.includes("playwright"), redisTop.join(", "));
const laravel = new Set(["always", "laravel", "symfony", ".git"]);
assert("Laravel includes context7", topNames(laravel).includes("context7"), topNames(laravel).join(", "));
assert("Laravel includes guard-dangerous-bash", topNames(laravel).includes("guard-dangerous-bash"), topNames(laravel).join(", "));
assert("Laravel excludes playwright", !topNames(laravel).includes("playwright"), topNames(laravel).join(", "));
const symfony = new Set(["always", "symfony", ".git"]);
assert("Symfony includes context7", topNames(symfony).includes("context7"), topNames(symfony).join(", "));
assert("Symfony includes guard-dangerous-bash", topNames(symfony).includes("guard-dangerous-bash"), topNames(symfony).join(", "));
assert("Symfony excludes playwright", !topNames(symfony).includes("playwright"), topNames(symfony).join(", "));
const spring = new Set(["always", "spring", "pom.xml", ".git"]);
assert("Spring includes context7", topNames(spring).includes("context7"), topNames(spring).join(", "));
assert("Spring includes guard-dangerous-bash", topNames(spring).includes("guard-dangerous-bash"), topNames(spring).join(", "));
assert("Spring excludes playwright", !topNames(spring).includes("playwright"), topNames(spring).join(", "));
const axum = new Set(["always", "axum", "Cargo.toml", ".git"]);
const axumTop = topNames(axum);
assert("Axum includes context7", axumTop.includes("context7"), axumTop.join(", "));
assert("Axum includes guard-dangerous-bash", axumTop.includes("guard-dangerous-bash"), axumTop.join(", "));
assert("Axum excludes playwright", !axumTop.includes("playwright"), axumTop.join(", "));
const actix = new Set(["always", "actix", "Cargo.toml", ".git"]);
const actixTop = topNames(actix);
assert("Actix includes context7", actixTop.includes("context7"), actixTop.join(", "));
assert("Actix includes guard-dangerous-bash", actixTop.includes("guard-dangerous-bash"), actixTop.join(", "));
assert("Actix excludes playwright", !actixTop.includes("playwright"), actixTop.join(", "));
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
const ginTop = topNames(gin);
assert("Gin includes context7", ginTop.includes("context7"), ginTop.join(", "));
assert("Gin includes guard-dangerous-bash", ginTop.includes("guard-dangerous-bash"), ginTop.join(", "));
assert("Gin excludes playwright", !ginTop.includes("playwright"), ginTop.join(", "));
const fiber = new Set(["always", "fiber", "go.mod", ".git"]);
const fiberTop = topNames(fiber);
assert("Fiber includes context7", fiberTop.includes("context7"), fiberTop.join(", "));
assert("Fiber includes guard-dangerous-bash", fiberTop.includes("guard-dangerous-bash"), fiberTop.join(", "));
assert("Fiber excludes playwright", !fiberTop.includes("playwright"), fiberTop.join(", "));
const echo = new Set(["always", "echo", "go.mod", ".git"]);
const echoTop = topNames(echo);
assert("Echo includes context7", echoTop.includes("context7"), echoTop.join(", "));
assert("Echo includes guard-dangerous-bash", echoTop.includes("guard-dangerous-bash"), echoTop.join(", "));
assert("Echo excludes playwright", !echoTop.includes("playwright"), echoTop.join(", "));

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
const reactNative = new Set(["always", "package.json", "react-native", ".git"]);
const rnTop = topNames(reactNative);
assert("React Native includes context7", rnTop.includes("context7"), rnTop.join(", "));
assert("React Native includes figma or playwright", rnTop.includes("figma") || rnTop.includes("playwright"), rnTop.join(", "));
assert("React Native excludes postgres by default", !rnTop.includes("postgres"), rnTop.join(", "));
const swiftMobile = new Set(["always", "swift", "build.gradle", ".git"]);
const swiftTop = topNames(swiftMobile);
assert("Swift includes context7", swiftTop.includes("context7"), swiftTop.join(", "));
assert("Swift excludes postgres by default", !swiftTop.includes("postgres"), swiftTop.join(", "));
assert("Swift excludes playwright", !swiftTop.includes("playwright"), swiftTop.join(", "));
const xcodeSwift = new Set(["always", "swift", "*.xcodeproj", ".git"]);
const xcodeTop = topNames(xcodeSwift);
assert("Xcode Swift includes context7", xcodeTop.includes("context7"), xcodeTop.join(", "));
assert("Xcode Swift excludes postgres by default", !xcodeTop.includes("postgres"), xcodeTop.join(", "));
assert("Xcode Swift excludes playwright", !xcodeTop.includes("playwright"), xcodeTop.join(", "));
const kotlinMobile = new Set(["always", "kotlin", "build.gradle", ".git"]);
const kotlinTop = topNames(kotlinMobile);
assert("Kotlin includes context7", kotlinTop.includes("context7"), kotlinTop.join(", "));
assert("Kotlin excludes postgres by default", !kotlinTop.includes("postgres"), kotlinTop.join(", "));
assert("Kotlin excludes playwright", !kotlinTop.includes("playwright"), kotlinTop.join(", "));

// DevOps / infra.
const devops = new Set(["always", "dockerfile", "terraform", "helm", "k8s", ".github/workflows", ".git"]);
const dvTop = topNames(devops);
assert("DevOps includes git or github", dvTop.includes("git") || dvTop.includes("github"), dvTop.join(", "));
assert("DevOps includes guard-dangerous-bash", dvTop.includes("guard-dangerous-bash"), dvTop.join(", "));
assert("DevOps excludes playwright", !dvTop.includes("playwright"), dvTop.join(", "));
const dockerCompose = new Set(["always", "dockerfile", "docker-compose", "terraform", ".git"]);
const dcTop = topNames(dockerCompose);
assert("docker-compose devops includes git or github", dcTop.includes("git") || dcTop.includes("github"), dcTop.join(", "));
assert("docker-compose devops includes guard-dangerous-bash", dcTop.includes("guard-dangerous-bash"), dcTop.join(", "));
assert("docker-compose devops excludes playwright", !dcTop.includes("playwright"), dcTop.join(", "));
const k8sDevops = new Set(["always", "k8s", "dockerfile", ".git"]);
const k8sTop = topNames(k8sDevops);
assert("k8s devops includes git or github", k8sTop.includes("git") || k8sTop.includes("github"), k8sTop.join(", "));
assert("k8s devops includes guard-dangerous-bash", k8sTop.includes("guard-dangerous-bash"), k8sTop.join(", "));
assert("k8s devops excludes playwright", !k8sTop.includes("playwright"), k8sTop.join(", "));
const terraformDevops = new Set(["always", "terraform", ".git"]);
const tfDevTop = topNames(terraformDevops);
assert("terraform devops includes git or github", tfDevTop.includes("git") || tfDevTop.includes("github"), tfDevTop.join(", "));
assert("terraform devops includes guard-dangerous-bash", tfDevTop.includes("guard-dangerous-bash"), tfDevTop.join(", "));
assert("terraform devops excludes playwright", !tfDevTop.includes("playwright"), tfDevTop.join(", "));
const helmDevops = new Set(["always", "helm", ".git"]);
const helmTop = topNames(helmDevops);
assert("helm devops includes git or github", helmTop.includes("git") || helmTop.includes("github"), helmTop.join(", "));
assert("helm devops includes guard-dangerous-bash", helmTop.includes("guard-dangerous-bash"), helmTop.join(", "));
assert("helm devops excludes playwright", !helmTop.includes("playwright"), helmTop.join(", "));
const githubActions = new Set(["always", ".github/workflows", "dockerfile", ".git"]);
const ghaTop = topNames(githubActions);
assert("GitHub Actions devops includes git or github", ghaTop.includes("git") || ghaTop.includes("github"), ghaTop.join(", "));
assert("GitHub Actions devops includes guard-dangerous-bash", ghaTop.includes("guard-dangerous-bash"), ghaTop.join(", "));
assert("GitHub Actions devops excludes playwright", !ghaTop.includes("playwright"), ghaTop.join(", "));
const turboMonorepo = new Set(["always", "monorepo", "turbo", "package.json", ".git"]);
const turboTop = topNames(turboMonorepo);
assert("turbo monorepo includes filesystem or git", turboTop.includes("filesystem") || turboTop.includes("git"), turboTop.join(", "));
assert("turbo monorepo includes guard-dangerous-bash", turboTop.includes("guard-dangerous-bash"), turboTop.join(", "));
assert("turbo monorepo excludes playwright", !turboTop.includes("playwright"), turboTop.join(", "));
const ansible = new Set(["always", "ansible", "dockerfile", "terraform", ".github/workflows", ".git"]);
const ansibleTop = topNames(ansible);
assert("Ansible includes git or github", ansibleTop.includes("git") || ansibleTop.includes("github"), ansibleTop.join(", "));
assert("Ansible includes guard-dangerous-bash", ansibleTop.includes("guard-dangerous-bash"), ansibleTop.join(", "));
assert("Ansible excludes playwright", !ansibleTop.includes("playwright"), ansibleTop.join(", "));

// Docs / writing.
const docsWriting = new Set(["always", "docs", "mkdocs", "docusaurus", ".docx"]);
const docsTop = topNames(docsWriting);
assert("Docs includes office-docs or notion", docsTop.includes("office-docs") || docsTop.includes("notion"), docsTop.join(", "));
assert("Docs excludes postgres by default", !docsTop.includes("postgres"), docsTop.join(", "));
const mkdocsOnly = new Set(["always", "mkdocs", "docs", ".git"]);
const mkTop = topNames(mkdocsOnly);
assert("MkDocs includes office-docs or notion", mkTop.includes("office-docs") || mkTop.includes("notion"), mkTop.join(", "));
assert("MkDocs excludes playwright", !mkTop.includes("playwright"), mkTop.join(", "));
const docusaurusOnly = new Set(["always", "package.json", "docusaurus", "docs", ".git"]);
const docusaurusTop = topNames(docusaurusOnly);
assert("Docusaurus includes office-docs or notion", docusaurusTop.includes("office-docs") || docusaurusTop.includes("notion"), docusaurusTop.join(", "));
assert("Docusaurus excludes playwright", !docusaurusTop.includes("playwright"), docusaurusTop.join(", "));
const stripeBackend = new Set(["always", "package.json", "express", "stripe", ".git"]);
const stripeBeTop = topNames(stripeBackend);
assert("Stripe backend includes context7", stripeBeTop.includes("context7"), stripeBeTop.join(", "));
assert("Stripe backend includes stripe mcp", stripeBeTop.includes("stripe"), stripeBeTop.join(", "));
assert("Stripe backend excludes playwright", !stripeBeTop.includes("playwright"), stripeBeTop.join(", "));

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
const nxMonorepo = new Set(["always", "monorepo", "nx", "dockerfile", ".git"]);
const nxTop = topNames(nxMonorepo);
assert("Nx includes filesystem or git", nxTop.includes("filesystem") || nxTop.includes("git"), nxTop.join(", "));
assert("Nx includes guard-dangerous-bash", nxTop.includes("guard-dangerous-bash"), nxTop.join(", "));
assert("Nx excludes playwright", !nxTop.includes("playwright"), nxTop.join(", "));
const pnpmMonorepo = new Set(["always", "monorepo", "turbo", "pnpm-lock.yaml", "pnpm-workspace", "package.json", ".git"]);
const pnpmTop = topNames(pnpmMonorepo);
assert("pnpm monorepo includes filesystem or git", pnpmTop.includes("filesystem") || pnpmTop.includes("git"), pnpmTop.join(", "));
assert("pnpm monorepo includes guard-dangerous-bash", pnpmTop.includes("guard-dangerous-bash"), pnpmTop.join(", "));
assert("pnpm monorepo excludes playwright", !pnpmTop.includes("playwright"), pnpmTop.join(", "));

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
