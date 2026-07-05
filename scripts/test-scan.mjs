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
  assert("scan adds latex from .tex file", signals.has("latex"));

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

  const nextDir = mkdtempSync(join(tmpdir(), "loadout-scan-next-"));
  try {
    writeFileSync(
      join(nextDir, "package.json"),
      JSON.stringify({ dependencies: { next: "14", react: "18" } }),
    );
    const nextSignals = scanProject(nextDir);
    assert("scan adds next from package.json", nextSignals.has("next"));
    assert("scan adds react from package.json", nextSignals.has("react"));
    const nextTop = topIds(nextSignals);
    assert("next project surfaces playwright", nextTop.includes("playwright"), nextTop.join(", "));
    assert("next project surfaces chrome-devtools", nextTop.includes("chrome-devtools"), nextTop.join(", "));
  } finally {
    rmSync(nextDir, { recursive: true, force: true });
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

  const svelteDir = mkdtempSync(join(tmpdir(), "loadout-scan-svelte-"));
  try {
    writeFileSync(join(svelteDir, "svelte.config.js"), "export default { compilerOptions: {} };\n");
    writeFileSync(join(svelteDir, "package.json"), JSON.stringify({ dependencies: { svelte: "4" } }));
    const svelteSignals = scanProject(svelteDir);
    assert("scan adds svelte from package.json", svelteSignals.has("svelte"));
    assert("plain svelte project omits sveltekit", !svelteSignals.has("sveltekit"));
    const svelteTop = topIds(svelteSignals);
    assert("svelte project surfaces playwright", svelteTop.includes("playwright"), svelteTop.join(", "));
  } finally {
    rmSync(svelteDir, { recursive: true, force: true });
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
    assert("nestjs project excludes playwright", !nestTop.includes("playwright"), nestTop.join(", "));
  } finally {
    rmSync(nestDir, { recursive: true, force: true });
  }

  const expressDir = mkdtempSync(join(tmpdir(), "loadout-scan-express-"));
  try {
    writeFileSync(join(expressDir, "package.json"), JSON.stringify({ dependencies: { express: "4" } }));
    const expressSignals = scanProject(expressDir);
    assert("scan adds express from package.json", expressSignals.has("express"));
    const expressTop = topIds(expressSignals);
    assert("express project surfaces context7", expressTop.includes("context7"), expressTop.join(", "));
    assert("express project excludes playwright", !expressTop.includes("playwright"), expressTop.join(", "));
  } finally {
    rmSync(expressDir, { recursive: true, force: true });
  }

  const flaskDir = mkdtempSync(join(tmpdir(), "loadout-scan-flask-"));
  try {
    writeFileSync(join(flaskDir, "requirements.txt"), "flask>=3.0\n");
    const flaskSignals = scanProject(flaskDir);
    assert("scan adds flask from requirements.txt", flaskSignals.has("flask"));
    const flaskTop = topIds(flaskSignals);
    assert("flask project surfaces context7", flaskTop.includes("context7"), flaskTop.join(", "));
    assert("flask project excludes playwright", !flaskTop.includes("playwright"), flaskTop.join(", "));
  } finally {
    rmSync(flaskDir, { recursive: true, force: true });
  }

  const prismaDir = mkdtempSync(join(tmpdir(), "loadout-scan-prisma-"));
  try {
    writeFileSync(
      join(prismaDir, "package.json"),
      JSON.stringify({ dependencies: { "@nestjs/core": "10", "@prisma/client": "5", prisma: "5" } }),
    );
    const prismaSignals = scanProject(prismaDir);
    assert("scan adds prisma from package.json", prismaSignals.has("prisma"));
    assert("scan adds nestjs from package.json", prismaSignals.has("nestjs"));
    const prismaTop = topIds(prismaSignals);
    assert("prisma project surfaces postgres", prismaTop.includes("postgres"), prismaTop.join(", "));
    assert("prisma project excludes playwright", !prismaTop.includes("playwright"), prismaTop.join(", "));
  } finally {
    rmSync(prismaDir, { recursive: true, force: true });
  }

  const drizzleDir = mkdtempSync(join(tmpdir(), "loadout-scan-drizzle-"));
  try {
    writeFileSync(
      join(drizzleDir, "package.json"),
      JSON.stringify({ dependencies: { "drizzle-orm": "0.30", postgres: "3" } }),
    );
    writeFileSync(join(drizzleDir, "drizzle.config.ts"), "export default {};\n");
    const drizzleSignals = scanProject(drizzleDir);
    assert("scan adds drizzle from package.json", drizzleSignals.has("drizzle"));
    assert("scan adds drizzle from drizzle.config.ts", drizzleSignals.has("drizzle"));
    assert("scan adds postgres from package.json", drizzleSignals.has("postgres"));
    const drizzleTop = topIds(drizzleSignals);
    assert("drizzle project surfaces postgres", drizzleTop.includes("postgres"), drizzleTop.join(", "));
    assert("drizzle project excludes playwright", !drizzleTop.includes("playwright"), drizzleTop.join(", "));
  } finally {
    rmSync(drizzleDir, { recursive: true, force: true });
  }

  const supabaseDir = mkdtempSync(join(tmpdir(), "loadout-scan-supabase-"));
  try {
    writeFileSync(
      join(supabaseDir, "package.json"),
      JSON.stringify({ dependencies: { "@supabase/supabase-js": "2" } }),
    );
    const supabaseSignals = scanProject(supabaseDir);
    assert("scan adds supabase from package.json", supabaseSignals.has("supabase"));
    const supabaseTop = topIds(supabaseSignals);
    assert("supabase project surfaces supabase mcp", supabaseTop.includes("supabase"), supabaseTop.join(", "));
    assert("supabase project excludes playwright", !supabaseTop.includes("playwright"), supabaseTop.join(", "));
  } finally {
    rmSync(supabaseDir, { recursive: true, force: true });
  }

  const mongoDir = mkdtempSync(join(tmpdir(), "loadout-scan-mongo-"));
  try {
    writeFileSync(
      join(mongoDir, "package.json"),
      JSON.stringify({ dependencies: { express: "4", mongoose: "8", mongodb: "6" } }),
    );
    const mongoSignals = scanProject(mongoDir);
    assert("scan adds mongoose from package.json", mongoSignals.has("mongoose"));
    assert("scan adds mongodb from package.json", mongoSignals.has("mongodb"));
    assert("scan adds express from package.json", mongoSignals.has("express"));
    const mongoTop = topIds(mongoSignals);
    assert("mongodb project surfaces mongodb mcp", mongoTop.includes("mongodb"), mongoTop.join(", "));
    assert("mongodb project excludes playwright", !mongoTop.includes("playwright"), mongoTop.join(", "));
  } finally {
    rmSync(mongoDir, { recursive: true, force: true });
  }

  const sentryDir = mkdtempSync(join(tmpdir(), "loadout-scan-sentry-"));
  try {
    writeFileSync(
      join(sentryDir, "package.json"),
      JSON.stringify({ dependencies: { express: "4", "@sentry/node": "8" } }),
    );
    const sentrySignals = scanProject(sentryDir);
    assert("scan adds sentry from package.json", sentrySignals.has("sentry"));
    assert("scan adds express from package.json", sentrySignals.has("express"));
    const sentryTop = topIds(sentrySignals);
    assert("sentry project surfaces sentry mcp", sentryTop.includes("sentry"), sentryTop.join(", "));
    assert("sentry project excludes playwright", !sentryTop.includes("playwright"), sentryTop.join(", "));
  } finally {
    rmSync(sentryDir, { recursive: true, force: true });
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

  const symfonyDir = mkdtempSync(join(tmpdir(), "loadout-scan-symfony-"));
  try {
    writeFileSync(
      join(symfonyDir, "composer.json"),
      JSON.stringify({ require: { "symfony/framework-bundle": "^7.0", "symfony/http-kernel": "^7.0" } }),
    );
    const symfonySignals = scanProject(symfonyDir);
    assert("scan adds symfony from composer.json (standalone)", symfonySignals.has("symfony"));
    assert("standalone symfony omits laravel", !symfonySignals.has("laravel"));
    const symfonyTop = topIds(symfonySignals);
    assert("symfony project surfaces context7", symfonyTop.includes("context7"), symfonyTop.join(", "));
    assert("symfony project excludes playwright", !symfonyTop.includes("playwright"), symfonyTop.join(", "));
  } finally {
    rmSync(symfonyDir, { recursive: true, force: true });
  }

  const mlflowDir = mkdtempSync(join(tmpdir(), "loadout-scan-mlflow-"));
  try {
    writeFileSync(join(mlflowDir, "requirements.txt"), "mlflow>=2.0\npandas\n");
    writeFileSync(join(mlflowDir, "train.ipynb"), '{"nbformat": 4}\n');
    const mlflowSignals = scanProject(mlflowDir);
    assert("scan adds mlflow from requirements.txt", mlflowSignals.has("mlflow"));
    assert("scan adds jupyter from notebook file", mlflowSignals.has("jupyter"));
    const mlflowTop = topIds(mlflowSignals);
    assert("mlflow project surfaces exa-research", mlflowTop.includes("exa-research"), mlflowTop.join(", "));
    assert("mlflow project excludes playwright", !mlflowTop.includes("playwright"), mlflowTop.join(", "));
  } finally {
    rmSync(mlflowDir, { recursive: true, force: true });
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

  const actixDir = mkdtempSync(join(tmpdir(), "loadout-scan-actix-"));
  try {
    writeFileSync(join(actixDir, "Cargo.toml"), '[dependencies]\nactix-web = "4"\ntokio = { version = "1", features = ["full"] }\n');
    const actixSignals = scanProject(actixDir);
    assert("scan adds actix from Cargo.toml", actixSignals.has("actix"));
    const actixTop = topIds(actixSignals);
    assert("actix project surfaces context7", actixTop.includes("context7"), actixTop.join(", "));
    assert("actix project excludes playwright", !actixTop.includes("playwright"), actixTop.join(", "));
  } finally {
    rmSync(actixDir, { recursive: true, force: true });
  }

  const djangoDir = mkdtempSync(join(tmpdir(), "loadout-scan-django-"));
  try {
    writeFileSync(join(djangoDir, "requirements.txt"), "django>=5.0\n");
    writeFileSync(join(djangoDir, "manage.py"), "#!/usr/bin/env python\n");
    const djangoSignals = scanProject(djangoDir);
    assert("scan adds django from requirements.txt", djangoSignals.has("django"));
    assert("scan adds django from manage.py", djangoSignals.has("django"));
    const djangoTop = topIds(djangoSignals);
    assert("django project surfaces context7", djangoTop.includes("context7"), djangoTop.join(", "));
    assert("django project excludes playwright", !djangoTop.includes("playwright"), djangoTop.join(", "));
  } finally {
    rmSync(djangoDir, { recursive: true, force: true });
  }

  const phoenixDir = mkdtempSync(join(tmpdir(), "loadout-scan-phoenix-"));
  try {
    mkdirSync(join(phoenixDir, "config"), { recursive: true });
    writeFileSync(
      join(phoenixDir, "mix.exs"),
      'defmodule Demo.MixProject do\n  use Mix.Project\n  def deps do\n    [{:phoenix, "~> 1.7"}]\n  end\nend\n',
    );
    writeFileSync(join(phoenixDir, "config/config.exs"), "import Config\n");
    const phoenixSignals = scanProject(phoenixDir);
    assert("scan adds phoenix from mix.exs", phoenixSignals.has("phoenix"));
    assert("scan adds elixir from mix.exs", phoenixSignals.has("elixir"));
    assert("scan adds phoenix from config/config.exs", phoenixSignals.has("phoenix"));
    const phoenixTop = topIds(phoenixSignals);
    assert("phoenix project surfaces context7", phoenixTop.includes("context7"), phoenixTop.join(", "));
    assert("phoenix project excludes playwright", !phoenixTop.includes("playwright"), phoenixTop.join(", "));
  } finally {
    rmSync(phoenixDir, { recursive: true, force: true });
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

  const fiberDir = mkdtempSync(join(tmpdir(), "loadout-scan-fiber-"));
  try {
    writeFileSync(
      join(fiberDir, "go.mod"),
      "module example.com/demo\n\ngo 1.22\n\nrequire github.com/gofiber/fiber/v2 v2.52.0\n",
    );
    const fiberSignals = scanProject(fiberDir);
    assert("scan adds fiber from go.mod", fiberSignals.has("fiber"));
    const fiberTop = topIds(fiberSignals);
    assert("fiber project surfaces context7", fiberTop.includes("context7"), fiberTop.join(", "));
    assert("fiber project excludes playwright", !fiberTop.includes("playwright"), fiberTop.join(", "));
  } finally {
    rmSync(fiberDir, { recursive: true, force: true });
  }

  const echoDir = mkdtempSync(join(tmpdir(), "loadout-scan-echo-"));
  try {
    writeFileSync(
      join(echoDir, "go.mod"),
      "module example.com/demo\n\ngo 1.22\n\nrequire github.com/labstack/echo/v4 v4.12.0\n",
    );
    const echoSignals = scanProject(echoDir);
    assert("scan adds echo from go.mod", echoSignals.has("echo"));
    const echoTop = topIds(echoSignals);
    assert("echo project surfaces context7", echoTop.includes("context7"), echoTop.join(", "));
    assert("echo project excludes playwright", !echoTop.includes("playwright"), echoTop.join(", "));
  } finally {
    rmSync(echoDir, { recursive: true, force: true });
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

  const swiftDir = mkdtempSync(join(tmpdir(), "loadout-scan-swift-"));
  try {
    writeFileSync(join(swiftDir, "Package.swift"), "// swift-tools-version:5.9\n");
    writeFileSync(join(swiftDir, "App.swift"), "import SwiftUI\n");
    writeFileSync(join(swiftDir, "build.gradle"), "android {}\n");
    const swiftSignals = scanProject(swiftDir);
    assert("scan adds swift from Package.swift", swiftSignals.has("swift"));
    assert("scan adds swift from .swift file", swiftSignals.has("swift"));
    assert("scan adds build.gradle signal", swiftSignals.has("build.gradle"));
    const swiftTop = topIds(swiftSignals);
    assert("swift project surfaces context7", swiftTop.includes("context7"), swiftTop.join(", "));
    assert("swift project excludes playwright", !swiftTop.includes("playwright"), swiftTop.join(", "));
  } finally {
    rmSync(swiftDir, { recursive: true, force: true });
  }

  const xcodeDir = mkdtempSync(join(tmpdir(), "loadout-scan-xcode-"));
  try {
    mkdirSync(join(xcodeDir, "Demo.xcodeproj"), { recursive: true });
    writeFileSync(join(xcodeDir, "App.swift"), "import SwiftUI\n");
    const xcodeSignals = scanProject(xcodeDir);
    assert("scan adds xcodeproj from .xcodeproj directory", xcodeSignals.has("*.xcodeproj"));
    assert("scan adds swift from .swift file (xcode)", xcodeSignals.has("swift"));
    const xcodeTop = topIds(xcodeSignals);
    assert("xcode project surfaces context7", xcodeTop.includes("context7"), xcodeTop.join(", "));
    assert("xcode project excludes playwright", !xcodeTop.includes("playwright"), xcodeTop.join(", "));
  } finally {
    rmSync(xcodeDir, { recursive: true, force: true });
  }

  const kotlinDir = mkdtempSync(join(tmpdir(), "loadout-scan-kotlin-"));
  try {
    writeFileSync(join(kotlinDir, "Main.kt"), "fun main() {}\n");
    writeFileSync(join(kotlinDir, "build.gradle"), "android {}\n");
    const kotlinSignals = scanProject(kotlinDir);
    assert("scan adds kotlin from .kt file", kotlinSignals.has("kotlin"));
    assert("scan adds build.gradle signal", kotlinSignals.has("build.gradle"));
    const kotlinTop = topIds(kotlinSignals);
    assert("kotlin project surfaces context7", kotlinTop.includes("context7"), kotlinTop.join(", "));
    assert("kotlin project excludes playwright", !kotlinTop.includes("playwright"), kotlinTop.join(", "));
  } finally {
    rmSync(kotlinDir, { recursive: true, force: true });
  }

  const unityDir = mkdtempSync(join(tmpdir(), "loadout-scan-unity-"));
  try {
    mkdirSync(join(unityDir, "ProjectSettings"), { recursive: true });
    writeFileSync(join(unityDir, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.0f1\n");
    const unitySignals = scanProject(unityDir);
    assert("scan adds unity from ProjectVersion.txt", unitySignals.has("unity"));
    const unityTop = topIds(unitySignals);
    assert("unity project surfaces context7", unityTop.includes("context7"), unityTop.join(", "));
    assert("unity project includes guard-dangerous-bash", unityTop.includes("guard-dangerous-bash"), unityTop.join(", "));
  } finally {
    rmSync(unityDir, { recursive: true, force: true });
  }

  const unrealDir = mkdtempSync(join(tmpdir(), "loadout-scan-unreal-"));
  try {
    writeFileSync(join(unrealDir, "Demo.uproject"), "{}\n");
    const unrealSignals = scanProject(unrealDir);
    assert("scan adds unreal from .uproject", unrealSignals.has("unreal"));
    const unrealTop = topIds(unrealSignals);
    assert("unreal project surfaces context7", unrealTop.includes("context7"), unrealTop.join(", "));
    assert("unreal project includes guard-dangerous-bash", unrealTop.includes("guard-dangerous-bash"), unrealTop.join(", "));
  } finally {
    rmSync(unrealDir, { recursive: true, force: true });
  }

  const godotDir = mkdtempSync(join(tmpdir(), "loadout-scan-godot-"));
  try {
    writeFileSync(join(godotDir, "project.godot"), "; Engine configuration file.\n");
    const godotSignals = scanProject(godotDir);
    assert("scan adds godot from project.godot", godotSignals.has("godot"));
    const godotTop = topIds(godotSignals);
    assert("godot project surfaces context7", godotTop.includes("context7"), godotTop.join(", "));
    assert("godot project includes guard-dangerous-bash", godotTop.includes("guard-dangerous-bash"), godotTop.join(", "));
  } finally {
    rmSync(godotDir, { recursive: true, force: true });
  }

  const devopsDir = mkdtempSync(join(tmpdir(), "loadout-scan-devops-"));
  try {
    writeFileSync(join(devopsDir, "Dockerfile"), "FROM alpine\n");
    writeFileSync(join(devopsDir, "docker-compose.yml"), "services:\n  app:\n    build: .\n");
    writeFileSync(join(devopsDir, "main.tf"), "resource \"null_resource\" \"x\" {}\n");
    writeFileSync(join(devopsDir, "Chart.yaml"), "name: demo\n");
    writeFileSync(join(devopsDir, "ansible.cfg"), "[defaults]\ninventory = hosts\n");
    mkdirSync(join(devopsDir, "k8s"), { recursive: true });
    writeFileSync(join(devopsDir, "k8s", "deploy.yaml"), "apiVersion: v1\n");
    const dvSignals = scanProject(devopsDir);
    assert("scan adds dockerfile signal", dvSignals.has("dockerfile"));
    assert("scan adds docker-compose from compose file", dvSignals.has("docker-compose"));
    assert("scan adds terraform from .tf", dvSignals.has("terraform"));
    assert("scan adds helm from Chart.yaml", dvSignals.has("helm"));
    assert("scan adds k8s from k8s/ directory", dvSignals.has("k8s"));
    assert("scan adds ansible from ansible.cfg", dvSignals.has("ansible"));
    const dvTop = topIds(dvSignals);
    assert("devops project surfaces github or git", dvTop.includes("github") || dvTop.includes("git"), dvTop.join(", "));
  } finally {
    rmSync(devopsDir, { recursive: true, force: true });
  }

  const k8sDir = mkdtempSync(join(tmpdir(), "loadout-scan-k8s-"));
  try {
    mkdirSync(join(k8sDir, "k8s"), { recursive: true });
    writeFileSync(join(k8sDir, "k8s", "deployment.yaml"), "apiVersion: apps/v1\nkind: Deployment\n");
    const k8sSignals = scanProject(k8sDir);
    assert("scan adds k8s from k8s/ directory (standalone)", k8sSignals.has("k8s"));
    assert("k8s-only omits dockerfile", !k8sSignals.has("dockerfile"));
    const k8sTop = topIds(k8sSignals);
    assert("k8s project surfaces git or github", k8sTop.includes("git") || k8sTop.includes("github"), k8sTop.join(", "));
    assert("k8s project excludes playwright", !k8sTop.includes("playwright"), k8sTop.join(", "));
  } finally {
    rmSync(k8sDir, { recursive: true, force: true });
  }

  const tfOnlyDir = mkdtempSync(join(tmpdir(), "loadout-scan-tf-only-"));
  try {
    writeFileSync(join(tfOnlyDir, "main.tf"), "resource \"null_resource\" \"demo\" {}\n");
    const tfOnlySignals = scanProject(tfOnlyDir);
    assert("scan adds terraform from .tf (standalone)", tfOnlySignals.has("terraform"));
    assert("terraform-only omits dockerfile", !tfOnlySignals.has("dockerfile"));
    const tfOnlyTop = topIds(tfOnlySignals);
    assert("terraform-only project surfaces git or github", tfOnlyTop.includes("git") || tfOnlyTop.includes("github"), tfOnlyTop.join(", "));
    assert("terraform-only project excludes playwright", !tfOnlyTop.includes("playwright"), tfOnlyTop.join(", "));
  } finally {
    rmSync(tfOnlyDir, { recursive: true, force: true });
  }

  const helmOnlyDir = mkdtempSync(join(tmpdir(), "loadout-scan-helm-only-"));
  try {
    writeFileSync(join(helmOnlyDir, "Chart.yaml"), "apiVersion: v2\nname: demo\n");
    const helmOnlySignals = scanProject(helmOnlyDir);
    assert("scan adds helm from Chart.yaml (standalone)", helmOnlySignals.has("helm"));
    assert("helm-only omits dockerfile", !helmOnlySignals.has("dockerfile"));
    const helmOnlyTop = topIds(helmOnlySignals);
    assert("helm-only project surfaces git or github", helmOnlyTop.includes("git") || helmOnlyTop.includes("github"), helmOnlyTop.join(", "));
    assert("helm-only project excludes playwright", !helmOnlyTop.includes("playwright"), helmOnlyTop.join(", "));
  } finally {
    rmSync(helmOnlyDir, { recursive: true, force: true });
  }

  const pyprojectDir = mkdtempSync(join(tmpdir(), "loadout-scan-pyproject-"));
  try {
    writeFileSync(
      join(pyprojectDir, "pyproject.toml"),
      "[project]\nname = \"demo\"\ndependencies = [\"numpy\"]\n",
    );
    const pySignals = scanProject(pyprojectDir);
    assert("scan adds pyproject.toml signal (standalone)", pySignals.has("pyproject.toml"));
    assert("scan adds numpy from pyproject.toml", pySignals.has("numpy"));
    const pyTop = topIds(pySignals);
    assert("pyproject project surfaces context7", pyTop.includes("context7"), pyTop.join(", "));
    assert("pyproject project excludes playwright", !pyTop.includes("playwright"), pyTop.join(", "));
  } finally {
    rmSync(pyprojectDir, { recursive: true, force: true });
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

  const pnpmDir = mkdtempSync(join(tmpdir(), "loadout-scan-pnpm-"));
  try {
    writeFileSync(join(pnpmDir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    writeFileSync(join(pnpmDir, "package.json"), JSON.stringify({ name: "pnpm-app" }));
    const pnpmSignals = scanProject(pnpmDir);
    assert("scan adds pnpm-lock.yaml signal", pnpmSignals.has("pnpm-lock.yaml"));
    assert("pnpm-lock alone omits monorepo", !pnpmSignals.has("monorepo"));
  } finally {
    rmSync(pnpmDir, { recursive: true, force: true });
  }

  const yarnDir = mkdtempSync(join(tmpdir(), "loadout-scan-yarn-"));
  try {
    writeFileSync(join(yarnDir, "yarn.lock"), "# yarn lockfile v1\n");
    writeFileSync(join(yarnDir, "package.json"), JSON.stringify({ name: "yarn-app" }));
    const yarnSignals = scanProject(yarnDir);
    assert("scan adds yarn.lock signal", yarnSignals.has("yarn.lock"));
    assert("yarn.lock alone omits monorepo", !yarnSignals.has("monorepo"));
  } finally {
    rmSync(yarnDir, { recursive: true, force: true });
  }

  const tailwindDir = mkdtempSync(join(tmpdir(), "loadout-scan-tailwind-"));
  try {
    writeFileSync(
      join(tailwindDir, "package.json"),
      JSON.stringify({ devDependencies: { tailwindcss: "3", react: "18" } }),
    );
    const twSignals = scanProject(tailwindDir);
    assert("scan adds tailwind from package.json", twSignals.has("tailwind"));
    const twTop = topIds(twSignals);
    assert("tailwind project surfaces playwright", twTop.includes("playwright"), twTop.join(", "));
  } finally {
    rmSync(tailwindDir, { recursive: true, force: true });
  }

  const tfDir = mkdtempSync(join(tmpdir(), "loadout-scan-tf-"));
  try {
    writeFileSync(join(tfDir, "requirements.txt"), "tensorflow>=2.15\nnumpy\n");
    const tfSignals = scanProject(tfDir);
    assert("scan adds tensorflow from requirements.txt", tfSignals.has("tensorflow"));
    const tfTop = topIds(tfSignals);
    assert("tensorflow project surfaces context7", tfTop.includes("context7"), tfTop.join(", "));
    assert("tensorflow project excludes playwright", !tfTop.includes("playwright"), tfTop.join(", "));
  } finally {
    rmSync(tfDir, { recursive: true, force: true });
  }

  const skDir = mkdtempSync(join(tmpdir(), "loadout-scan-sklearn-"));
  try {
    writeFileSync(join(skDir, "requirements.txt"), "scikit-learn>=1.4\nnumpy\n");
    const skSignals = scanProject(skDir);
    assert("scan adds scikit-learn from requirements.txt", skSignals.has("scikit-learn"));
    const skTop = topIds(skSignals);
    assert("scikit-learn project surfaces context7", skTop.includes("context7"), skTop.join(", "));
    assert("scikit-learn project excludes playwright", !skTop.includes("playwright"), skTop.join(", "));
  } finally {
    rmSync(skDir, { recursive: true, force: true });
  }

  const uvDir = mkdtempSync(join(tmpdir(), "loadout-scan-uv-"));
  try {
    writeFileSync(join(uvDir, "uv.lock"), "version = 1\n");
    writeFileSync(join(uvDir, "pyproject.toml"), "[project]\nname = \"demo\"\n");
    const uvSignals = scanProject(uvDir);
    assert("scan adds uv.lock signal", uvSignals.has("uv.lock"));
    assert("scan adds pyproject.toml signal", uvSignals.has("pyproject.toml"));
    const uvTop = topIds(uvSignals);
    assert("uv project surfaces context7", uvTop.includes("context7"), uvTop.join(", "));
    assert("uv project excludes playwright", !uvTop.includes("playwright"), uvTop.join(", "));
  } finally {
    rmSync(uvDir, { recursive: true, force: true });
  }

  const arxivDir = mkdtempSync(join(tmpdir(), "loadout-scan-arxiv-"));
  try {
    writeFileSync(join(arxivDir, "requirements.txt"), "arxiv\nnumpy\n");
    writeFileSync(join(arxivDir, "fetch_papers.ipynb"), '{"nbformat": 4}\n');
    const arxivSignals = scanProject(arxivDir);
    assert("scan adds arxiv from requirements.txt", arxivSignals.has("arxiv"));
    assert("scan adds jupyter from notebook file", arxivSignals.has("jupyter"));
    const arxivTop = topIds(arxivSignals);
    assert("arxiv project surfaces exa-research", arxivTop.includes("exa-research"), arxivTop.join(", "));
    assert("arxiv project excludes playwright", !arxivTop.includes("playwright"), arxivTop.join(", "));
  } finally {
    rmSync(arxivDir, { recursive: true, force: true });
  }

  const pandasDir = mkdtempSync(join(tmpdir(), "loadout-scan-pandas-"));
  try {
    writeFileSync(join(pandasDir, "requirements.txt"), "pandas>=2.0\nnumpy\n");
    const pandasSignals = scanProject(pandasDir);
    assert("scan adds pandas from requirements.txt", pandasSignals.has("pandas"));
    const pandasTop = topIds(pandasSignals);
    assert("pandas project surfaces context7", pandasTop.includes("context7"), pandasTop.join(", "));
    assert("pandas project excludes playwright", !pandasTop.includes("playwright"), pandasTop.join(", "));
  } finally {
    rmSync(pandasDir, { recursive: true, force: true });
  }

  const nxDir = mkdtempSync(join(tmpdir(), "loadout-scan-nx-"));
  try {
    writeFileSync(join(nxDir, "nx.json"), "{}\n");
    writeFileSync(join(nxDir, "package.json"), JSON.stringify({ name: "nx-root" }));
    const nxSignals = scanProject(nxDir);
    assert("scan adds nx from nx.json", nxSignals.has("nx"));
    assert("scan adds monorepo from nx.json", nxSignals.has("monorepo"));
    const nxTop = topIds(nxSignals);
    assert("nx project surfaces filesystem or git", nxTop.includes("filesystem") || nxTop.includes("git"), nxTop.join(", "));
    assert("nx project excludes playwright", !nxTop.includes("playwright"), nxTop.join(", "));
  } finally {
    rmSync(nxDir, { recursive: true, force: true });
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

  const mkdocsDir = mkdtempSync(join(tmpdir(), "loadout-scan-mkdocs-"));
  try {
    writeFileSync(join(mkdocsDir, "mkdocs.yml"), "site_name: Demo\n");
    mkdirSync(join(mkdocsDir, "docs"), { recursive: true });
    writeFileSync(join(mkdocsDir, "docs", "index.md"), "# Demo\n");
    const mkSignals = scanProject(mkdocsDir);
    assert("scan adds mkdocs from mkdocs.yml (standalone)", mkSignals.has("mkdocs"));
    assert("scan adds docs from docs/ directory (standalone)", mkSignals.has("docs"));
    const mkTop = topIds(mkSignals);
    assert("mkdocs project surfaces office-docs or notion", mkTop.includes("office-docs") || mkTop.includes("notion"), mkTop.join(", "));
    assert("mkdocs project excludes playwright", !mkTop.includes("playwright"), mkTop.join(", "));
  } finally {
    rmSync(mkdocsDir, { recursive: true, force: true });
  }

  const docusaurusDir = mkdtempSync(join(tmpdir(), "loadout-scan-docusaurus-"));
  try {
    writeFileSync(
      join(docusaurusDir, "package.json"),
      JSON.stringify({ dependencies: { "@docusaurus/core": "3", "@docusaurus/preset-classic": "3" } }),
    );
    const docusaurusSignals = scanProject(docusaurusDir);
    assert("scan adds docusaurus from package.json (standalone)", docusaurusSignals.has("docusaurus"));
    const docusaurusTop = topIds(docusaurusSignals);
    assert("docusaurus project surfaces office-docs or notion", docusaurusTop.includes("office-docs") || docusaurusTop.includes("notion"), docusaurusTop.join(", "));
    assert("docusaurus project excludes playwright", !docusaurusTop.includes("playwright"), docusaurusTop.join(", "));
  } finally {
    rmSync(docusaurusDir, { recursive: true, force: true });
  }

  const stripeDir = mkdtempSync(join(tmpdir(), "loadout-scan-stripe-"));
  try {
    writeFileSync(
      join(stripeDir, "package.json"),
      JSON.stringify({ dependencies: { express: "4", stripe: "14" } }),
    );
    const stripeSignals = scanProject(stripeDir);
    assert("scan adds stripe from package.json (backend)", stripeSignals.has("stripe"));
    assert("scan adds express from package.json (backend)", stripeSignals.has("express"));
    const stripeTop = topIds(stripeSignals);
    assert("stripe backend surfaces stripe mcp", stripeTop.includes("stripe"), stripeTop.join(", "));
    assert("stripe backend excludes playwright", !stripeTop.includes("playwright"), stripeTop.join(", "));
  } finally {
    rmSync(stripeDir, { recursive: true, force: true });
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
