#!/usr/bin/env node
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanProject } from "../cli/lib/scan.mjs";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";

const dir = mkdtempSync(join(tmpdir(), "loadout-scan-"));
const CLEAN_ROOT = join(tmpdir(), `loadout-clean-scan-${process.pid}`);
const catalog = loadCatalog();
let failed = 0;

function topIds(signals) {
  return recommend(catalog, signals, CLEAN_ROOT).items.slice(0, 8).map((e) => e.item.id);
}

function assert(name, cond) {
  if (!cond) {
    console.error(`❌ ${name}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

try {
  writeFileSync(join(dir, "notebook.ipynb"), JSON.stringify({ cells: [] }));
  writeFileSync(join(dir, "references.bib"), "@article{demo, title={Demo}}\n");

  mkdirSync(join(dir, "papers"), { recursive: true });
  writeFileSync(join(dir, "papers", "draft.tex"), "\\documentclass{article}\n");

  const signals = scanProject(dir);
  assert("scan adds .ipynb from notebook file", signals.has(".ipynb"));
  assert("scan adds jupyter from notebook file", signals.has("jupyter"));
  assert("scan adds .bib from references file", signals.has(".bib"));
  assert("scan adds papers from papers/ directory", signals.has("papers"));

  const top = topIds(signals);
  assert("notebook scan surfaces exa-research", top.includes("exa-research"), top.join(", "));
  assert("papers scan surfaces tavily-research", top.includes("tavily-research"), top.join(", "));

  const viteDir = mkdtempSync(join(tmpdir(), "loadout-scan-vite-"));
  try {
    writeFileSync(join(viteDir, "vite.config.ts"), "export default {}\n");
    writeFileSync(join(viteDir, "tsconfig.json"), "{}\n");
    writeFileSync(join(viteDir, "package.json"), "{}");
    const viteSignals = scanProject(viteDir);
    assert("scan adds vite from vite.config.ts", viteSignals.has("vite"));
    assert("scan adds tsconfig.json signal", viteSignals.has("tsconfig.json"));
    const viteTop = topIds(viteSignals);
    assert("vite project surfaces playwright", viteTop.includes("playwright"), viteTop.join(", "));
  } finally {
    rmSync(viteDir, { recursive: true, force: true });
  }

  const angularDir = mkdtempSync(join(tmpdir(), "loadout-scan-ng-"));
  try {
    writeFileSync(join(angularDir, "angular.json"), "{}\n");
    writeFileSync(join(angularDir, "package.json"), JSON.stringify({ dependencies: { "@angular/core": "18" } }));
    const ngSignals = scanProject(angularDir);
    assert("scan adds angular from angular.json", ngSignals.has("angular"));
    assert("scan adds angular from @angular/core", ngSignals.has("angular"));
    const ngTop = topIds(ngSignals);
    assert("angular project surfaces playwright", ngTop.includes("playwright"), ngTop.join(", "));
  } finally {
    rmSync(angularDir, { recursive: true, force: true });
  }

  const astroDir = mkdtempSync(join(tmpdir(), "loadout-scan-astro-"));
  try {
    writeFileSync(join(astroDir, "astro.config.mjs"), "export default {};\n");
    writeFileSync(join(astroDir, "package.json"), JSON.stringify({ dependencies: { astro: "4" } }));
    const astroSignals = scanProject(astroDir);
    assert("scan adds astro from astro.config", astroSignals.has("astro"));
    assert("scan adds astro from package.json", astroSignals.has("astro"));
    const astroTop = topIds(astroSignals);
    assert("astro project surfaces playwright", astroTop.includes("playwright"), astroTop.join(", "));
  } finally {
    rmSync(astroDir, { recursive: true, force: true });
  }

  const remixDir = mkdtempSync(join(tmpdir(), "loadout-scan-remix-"));
  try {
    writeFileSync(
      join(remixDir, "package.json"),
      JSON.stringify({ dependencies: { "@remix-run/react": "2", "@remix-run/node": "2" } }),
    );
    const remixSignals = scanProject(remixDir);
    assert("scan adds remix from @remix-run packages", remixSignals.has("remix"));
    const remixTop = topIds(remixSignals);
    assert("remix project surfaces playwright", remixTop.includes("playwright"), remixTop.join(", "));
  } finally {
    rmSync(remixDir, { recursive: true, force: true });
  }

  const kitDir = mkdtempSync(join(tmpdir(), "loadout-scan-kit-"));
  try {
    writeFileSync(join(kitDir, "svelte.config.js"), "import adapter from '@sveltejs/kit';\n");
    writeFileSync(join(kitDir, "package.json"), JSON.stringify({ dependencies: { "@sveltejs/kit": "2" } }));
    const kitSignals = scanProject(kitDir);
    assert("scan adds sveltekit from package", kitSignals.has("sveltekit"));
    assert("scan adds sveltekit from svelte.config", kitSignals.has("sveltekit"));
    const kitTop = topIds(kitSignals);
    assert("sveltekit project surfaces playwright", kitTop.includes("playwright"), kitTop.join(", "));
  } finally {
    rmSync(kitDir, { recursive: true, force: true });
  }

  const nuxtDir = mkdtempSync(join(tmpdir(), "loadout-scan-nuxt-"));
  try {
    writeFileSync(join(nuxtDir, "nuxt.config.ts"), "export default {};\n");
    writeFileSync(join(nuxtDir, "package.json"), JSON.stringify({ dependencies: { nuxt: "3" } }));
    const nuxtSignals = scanProject(nuxtDir);
    assert("scan adds nuxt from nuxt.config", nuxtSignals.has("nuxt"));
    assert("scan adds nuxt from package.json", nuxtSignals.has("nuxt"));
    const nuxtTop = topIds(nuxtSignals);
    assert("nuxt project surfaces playwright", nuxtTop.includes("playwright"), nuxtTop.join(", "));
  } finally {
    rmSync(nuxtDir, { recursive: true, force: true });
  }

  const solidDir = mkdtempSync(join(tmpdir(), "loadout-scan-solid-"));
  try {
    writeFileSync(
      join(solidDir, "package.json"),
      JSON.stringify({ dependencies: { "solid-js": "1", "@solidjs/router": "0.10" } }),
    );
    const solidSignals = scanProject(solidDir);
    assert("scan adds solid from solid-js package", solidSignals.has("solid"));
    assert("scan adds solid from @solidjs packages", solidSignals.has("solid"));
    const solidTop = topIds(solidSignals);
    assert("solid project surfaces playwright", solidTop.includes("playwright"), solidTop.join(", "));
  } finally {
    rmSync(solidDir, { recursive: true, force: true });
  }

  const qwikDir = mkdtempSync(join(tmpdir(), "loadout-scan-qwik-"));
  try {
    writeFileSync(
      join(qwikDir, "package.json"),
      JSON.stringify({ dependencies: { "@builder.io/qwik": "1", "@builder.io/qwik-city": "1" } }),
    );
    const qwikSignals = scanProject(qwikDir);
    assert("scan adds qwik from @builder.io/qwik", qwikSignals.has("qwik"));
    const qwikTop = topIds(qwikSignals);
    assert("qwik project surfaces playwright", qwikTop.includes("playwright"), qwikTop.join(", "));
  } finally {
    rmSync(qwikDir, { recursive: true, force: true });
  }

  const bunDir = mkdtempSync(join(tmpdir(), "loadout-scan-bun-"));
  try {
    writeFileSync(join(bunDir, "bun.lock"), "# bun lockfile\n");
    writeFileSync(join(bunDir, "package.json"), JSON.stringify({ name: "bun-demo" }));
    const bunSignals = scanProject(bunDir);
    assert("scan adds bun from bun.lock", bunSignals.has("bun"));
    const bunTop = topIds(bunSignals);
    assert("bun project surfaces playwright", bunTop.includes("playwright"), bunTop.join(", "));
  } finally {
    rmSync(bunDir, { recursive: true, force: true });
  }

  const denoDir = mkdtempSync(join(tmpdir(), "loadout-scan-deno-"));
  try {
    writeFileSync(join(denoDir, "deno.json"), "{}\n");
    const denoSignals = scanProject(denoDir);
    assert("scan adds deno from deno.json", denoSignals.has("deno"));
    const denoTop = topIds(denoSignals);
    assert("deno project surfaces playwright", denoTop.includes("playwright"), denoTop.join(", "));
  } finally {
    rmSync(denoDir, { recursive: true, force: true });
  }

  const vitepressDir = mkdtempSync(join(tmpdir(), "loadout-scan-vitepress-"));
  try {
    writeFileSync(join(vitepressDir, "vitepress.config.ts"), "export default {};\n");
    writeFileSync(join(vitepressDir, "package.json"), JSON.stringify({ devDependencies: { vitepress: "1" } }));
    const vpSignals = scanProject(vitepressDir);
    assert("scan adds vitepress from vitepress.config", vpSignals.has("vitepress"));
    assert("scan adds vitepress from package.json", vpSignals.has("vitepress"));
    const vpTop = topIds(vpSignals);
    assert("vitepress project surfaces office-docs or notion", vpTop.includes("office-docs") || vpTop.includes("notion"), vpTop.join(", "));
  } finally {
    rmSync(vitepressDir, { recursive: true, force: true });
  }

  const nestDir = mkdtempSync(join(tmpdir(), "loadout-scan-nest-"));
  try {
    writeFileSync(join(nestDir, "nest-cli.json"), "{}\n");
    writeFileSync(join(nestDir, "package.json"), JSON.stringify({ dependencies: { fastify: "4", "@nestjs/core": "10" } }));
    const nestSignals = scanProject(nestDir);
    assert("scan adds nestjs from nest-cli.json", nestSignals.has("nestjs"));
    assert("scan adds fastify from package.json", nestSignals.has("fastify"));
    const nestTop = topIds(nestSignals);
    assert("nestjs project surfaces postgres or context7", nestTop.includes("postgres") || nestTop.includes("context7"), nestTop.join(", "));
  } finally {
    rmSync(nestDir, { recursive: true, force: true });
  }

  const honoDir = mkdtempSync(join(tmpdir(), "loadout-scan-hono-"));
  try {
    writeFileSync(
      join(honoDir, "package.json"),
      JSON.stringify({ dependencies: { hono: "4", "@hono/node-server": "1" } }),
    );
    const honoSignals = scanProject(honoDir);
    assert("scan adds hono from hono package", honoSignals.has("hono"));
    assert("scan adds hono from @hono packages", honoSignals.has("hono"));
    const honoTop = topIds(honoSignals);
    assert("hono project surfaces context7", honoTop.includes("context7"), honoTop.join(", "));
    assert("hono project excludes playwright", !honoTop.includes("playwright"), honoTop.join(", "));
  } finally {
    rmSync(honoDir, { recursive: true, force: true });
  }

  const elysiaDir = mkdtempSync(join(tmpdir(), "loadout-scan-elysia-"));
  try {
    writeFileSync(join(elysiaDir, "package.json"), JSON.stringify({ dependencies: { elysia: "1" } }));
    const elysiaSignals = scanProject(elysiaDir);
    assert("scan adds elysia from package", elysiaSignals.has("elysia"));
    const elysiaTop = topIds(elysiaSignals);
    assert("elysia project surfaces guard-dangerous-bash", elysiaTop.includes("guard-dangerous-bash"), elysiaTop.join(", "));
  } finally {
    rmSync(elysiaDir, { recursive: true, force: true });
  }

  const trpcDir = mkdtempSync(join(tmpdir(), "loadout-scan-trpc-"));
  try {
    writeFileSync(
      join(trpcDir, "package.json"),
      JSON.stringify({ dependencies: { "@trpc/server": "11", "@trpc/client": "11" } }),
    );
    const trpcSignals = scanProject(trpcDir);
    assert("scan adds trpc from @trpc packages", trpcSignals.has("trpc"));
    const trpcTop = topIds(trpcSignals);
    assert("trpc project surfaces context7", trpcTop.includes("context7"), trpcTop.join(", "));
  } finally {
    rmSync(trpcDir, { recursive: true, force: true });
  }

  const graphqlDir = mkdtempSync(join(tmpdir(), "loadout-scan-graphql-"));
  try {
    writeFileSync(
      join(graphqlDir, "package.json"),
      JSON.stringify({ dependencies: { graphql: "16", "@apollo/server": "4" } }),
    );
    writeFileSync(join(graphqlDir, "schema.graphql"), "type Query { hello: String }\n");
    const gqlSignals = scanProject(graphqlDir);
    assert("scan adds graphql from graphql package", gqlSignals.has("graphql"));
    assert("scan adds graphql from @apollo packages", gqlSignals.has("graphql"));
    assert("scan adds graphql from schema.graphql", gqlSignals.has("graphql"));
    const gqlTop = topIds(gqlSignals);
    assert("graphql project surfaces context7", gqlTop.includes("context7"), gqlTop.join(", "));
    assert("graphql project excludes playwright", !gqlTop.includes("playwright"), gqlTop.join(", "));
  } finally {
    rmSync(graphqlDir, { recursive: true, force: true });
  }

  const redisDir = mkdtempSync(join(tmpdir(), "loadout-scan-redis-"));
  try {
    writeFileSync(
      join(redisDir, "package.json"),
      JSON.stringify({ dependencies: { ioredis: "5", "@upstash/redis": "1" } }),
    );
    const redisSignals = scanProject(redisDir);
    assert("scan adds redis from ioredis", redisSignals.has("redis"));
    assert("scan adds redis from @upstash/redis", redisSignals.has("redis"));
    const redisTop = topIds(redisSignals);
    assert("redis project surfaces context7", redisTop.includes("context7"), redisTop.join(", "));
    assert("redis project excludes playwright", !redisTop.includes("playwright"), redisTop.join(", "));
  } finally {
    rmSync(redisDir, { recursive: true, force: true });
  }

  const laravelDir = mkdtempSync(join(tmpdir(), "loadout-scan-laravel-"));
  try {
    writeFileSync(
      join(laravelDir, "composer.json"),
      JSON.stringify({ require: { "laravel/framework": "^11.0", "symfony/http-kernel": "^7.0" } }),
    );
    writeFileSync(join(laravelDir, "artisan"), "#!/usr/bin/env php\n");
    const laravelSignals = scanProject(laravelDir);
    assert("scan adds laravel from composer.json", laravelSignals.has("laravel"));
    assert("scan adds laravel from artisan", laravelSignals.has("laravel"));
    assert("scan adds symfony from composer.json", laravelSignals.has("symfony"));
    const laravelTop = topIds(laravelSignals);
    assert("laravel project surfaces context7", laravelTop.includes("context7"), laravelTop.join(", "));
    assert("laravel project excludes playwright", !laravelTop.includes("playwright"), laravelTop.join(", "));
  } finally {
    rmSync(laravelDir, { recursive: true, force: true });
  }

  const springDir = mkdtempSync(join(tmpdir(), "loadout-scan-spring-"));
  try {
    writeFileSync(
      join(springDir, "pom.xml"),
      "<project><dependencies><dependency><artifactId>spring-boot-starter-web</artifactId></dependency></dependencies></project>\n",
    );
    writeFileSync(join(springDir, "application.properties"), "server.port=8080\n");
    const springSignals = scanProject(springDir);
    assert("scan adds spring from pom.xml", springSignals.has("spring"));
    assert("scan adds spring from application.properties", springSignals.has("spring"));
    const springTop = topIds(springSignals);
    assert("spring project surfaces context7", springTop.includes("context7"), springTop.join(", "));
    assert("spring project excludes playwright", !springTop.includes("playwright"), springTop.join(", "));
  } finally {
    rmSync(springDir, { recursive: true, force: true });
  }

  const axumDir = mkdtempSync(join(tmpdir(), "loadout-scan-axum-"));
  try {
    writeFileSync(join(axumDir, "Cargo.toml"), '[dependencies]\naxum = "0.7"\ntokio = { version = "1", features = ["full"] }\n');
    const axumSignals = scanProject(axumDir);
    assert("scan adds axum from Cargo.toml", axumSignals.has("axum"));
    assert("scan adds Cargo.toml signal", axumSignals.has("cargo.toml"));
    const axumTop = topIds(axumSignals);
    assert("axum project surfaces context7", axumTop.includes("context7"), axumTop.join(", "));
    assert("axum project excludes playwright", !axumTop.includes("playwright"), axumTop.join(", "));
  } finally {
    rmSync(axumDir, { recursive: true, force: true });
  }

  const railsDir = mkdtempSync(join(tmpdir(), "loadout-scan-rails-"));
  try {
    mkdirSync(join(railsDir, "config"), { recursive: true });
    writeFileSync(join(railsDir, "Gemfile"), "source 'https://rubygems.org'\ngem 'rails', '~> 7.0'\n");
    writeFileSync(join(railsDir, "config/application.rb"), "module Demo\nend\n");
    const railsSignals = scanProject(railsDir);
    assert("scan adds rails from Gemfile", railsSignals.has("rails"));
    assert("scan adds rails from config/application.rb", railsSignals.has("rails"));
    const railsTop = topIds(railsSignals);
    assert("rails project surfaces context7", railsTop.includes("context7"), railsTop.join(", "));
    assert("rails project excludes playwright", !railsTop.includes("playwright"), railsTop.join(", "));
  } finally {
    rmSync(railsDir, { recursive: true, force: true });
  }

  const ginDir = mkdtempSync(join(tmpdir(), "loadout-scan-gin-"));
  try {
    writeFileSync(
      join(ginDir, "go.mod"),
      "module example.com/demo\n\ngo 1.22\n\nrequire github.com/gin-gonic/gin v1.10.0\n",
    );
    const ginSignals = scanProject(ginDir);
    assert("scan adds gin from go.mod", ginSignals.has("gin"));
    assert("scan adds go.mod signal", ginSignals.has("go.mod"));
    const ginTop = topIds(ginSignals);
    assert("gin project surfaces context7", ginTop.includes("context7"), ginTop.join(", "));
    assert("gin project excludes playwright", !ginTop.includes("playwright"), ginTop.join(", "));
  } finally {
    rmSync(ginDir, { recursive: true, force: true });
  }

  const flutterDir = mkdtempSync(join(tmpdir(), "loadout-scan-flutter-"));
  try {
    writeFileSync(join(flutterDir, "pubspec.yaml"), "name: demo\nflutter:\n  assets: []\n");
    writeFileSync(join(flutterDir, "build.gradle"), "android {}\n");
    const flSignals = scanProject(flutterDir);
    assert("scan adds pubspec.yaml signal", flSignals.has("pubspec.yaml"));
    assert("scan adds flutter from pubspec", flSignals.has("flutter"));
    assert("scan adds build.gradle signal", flSignals.has("build.gradle"));
    const flTop = topIds(flSignals);
    assert("flutter project surfaces context7", flTop.includes("context7"), flTop.join(", "));
  } finally {
    rmSync(flutterDir, { recursive: true, force: true });
  }

  const devopsDir = mkdtempSync(join(tmpdir(), "loadout-scan-devops-"));
  try {
    writeFileSync(join(devopsDir, "Dockerfile"), "FROM alpine\n");
    writeFileSync(join(devopsDir, "main.tf"), "resource \"null_resource\" \"x\" {}\n");
    writeFileSync(join(devopsDir, "Chart.yaml"), "name: demo\n");
    mkdirSync(join(devopsDir, "k8s"), { recursive: true });
    writeFileSync(join(devopsDir, "k8s", "deploy.yaml"), "apiVersion: v1\n");
    const dvSignals = scanProject(devopsDir);
    assert("scan adds dockerfile signal", dvSignals.has("dockerfile"));
    assert("scan adds terraform from .tf", dvSignals.has("terraform"));
    assert("scan adds helm from Chart.yaml", dvSignals.has("helm"));
    assert("scan adds k8s from k8s/ directory", dvSignals.has("k8s"));
    const dvTop = topIds(dvSignals);
    assert("devops project surfaces github or git", dvTop.includes("github") || dvTop.includes("git"), dvTop.join(", "));
  } finally {
    rmSync(devopsDir, { recursive: true, force: true });
  }

  const monoDir = mkdtempSync(join(tmpdir(), "loadout-scan-mono-"));
  try {
    writeFileSync(join(monoDir, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
    writeFileSync(join(monoDir, "turbo.json"), "{}\n");
    mkdirSync(join(monoDir, "packages", "app"), { recursive: true });
    writeFileSync(join(monoDir, "packages", "app", "package.json"), JSON.stringify({ name: "app" }));
    const monoSignals = scanProject(monoDir);
    assert("scan adds monorepo from pnpm-workspace.yaml", monoSignals.has("monorepo"));
    assert("scan adds turbo from turbo.json", monoSignals.has("turbo"));
    assert("scan adds pnpm-workspace signal", monoSignals.has("pnpm-workspace"));
    const monoTop = topIds(monoSignals);
    assert("monorepo project surfaces filesystem or git", monoTop.includes("filesystem") || monoTop.includes("git"), monoTop.join(", "));
  } finally {
    rmSync(monoDir, { recursive: true, force: true });
  }

  const workspacesDir = mkdtempSync(join(tmpdir(), "loadout-scan-ws-"));
  try {
    writeFileSync(
      join(workspacesDir, "package.json"),
      JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    );
    const wsSignals = scanProject(workspacesDir);
    assert("scan adds monorepo from package.json workspaces", wsSignals.has("monorepo"));
  } finally {
    rmSync(workspacesDir, { recursive: true, force: true });
  }

  const docsDir = mkdtempSync(join(tmpdir(), "loadout-scan-docs-"));
  try {
    mkdirSync(join(docsDir, "docs"), { recursive: true });
    writeFileSync(join(docsDir, "docs", "guide.md"), "# Guide\n");
    writeFileSync(join(docsDir, "mkdocs.yml"), "site_name: Demo\n");
    writeFileSync(join(docsDir, "report.docx"), "PK\n");
    writeFileSync(join(docsDir, "package.json"), JSON.stringify({ dependencies: { "@docusaurus/core": "3" } }));
    const docSignals = scanProject(docsDir);
    assert("scan adds docs from docs/ directory", docSignals.has("docs"));
    assert("scan adds mkdocs from mkdocs.yml", docSignals.has("mkdocs"));
    assert("scan adds .docx from office file", docSignals.has(".docx"));
    assert("scan adds docusaurus from package", docSignals.has("docusaurus"));
    const docTop = topIds(docSignals);
    assert("docs project surfaces office-docs or notion", docTop.includes("office-docs") || docTop.includes("notion"), docTop.join(", "));
  } finally {
    rmSync(docsDir, { recursive: true, force: true });
  }

  const authDir = mkdtempSync(join(tmpdir(), "loadout-scan-auth-"));
  try {
    writeFileSync(
      join(authDir, "package.json"),
      JSON.stringify({ dependencies: { "next-auth": "4", jsonwebtoken: "9", stripe: "14" } }),
    );
    writeFileSync(join(authDir, ".env"), "SECRET=1\n");
    const authSignals = scanProject(authDir);
    assert("scan adds auth from next-auth", authSignals.has("auth"));
    assert("scan adds jwt from jsonwebtoken", authSignals.has("jwt"));
    assert("scan adds stripe from package", authSignals.has("stripe"));
    assert("scan adds .env signal", authSignals.has(".env"));
    const authTop = topIds(authSignals);
    assert("auth project surfaces protect-secrets or guard-dangerous-bash", authTop.includes("protect-secrets") || authTop.includes("guard-dangerous-bash"), authTop.join(", "));
  } finally {
    rmSync(authDir, { recursive: true, force: true });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll scan signal checks passed.");
