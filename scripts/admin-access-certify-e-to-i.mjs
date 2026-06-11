import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

function loadEnv() {
  const envText = readFileSync(".env", "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key] = rawValue.trim().replace(/^"(.*)"$/, "$1");
  }
}

function safeError(error) {
  return error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED_URL]") : String(error);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    delay(ms).then(() => {
      throw new Error(`${label} timed out after ${ms}ms`);
    })
  ]);
}

function databaseUrlWithTimeout() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=10`;
}

function summarizeResponse(response, text) {
  return {
    status: response.status,
    ok: response.ok,
    location: response.headers.get("location") ?? null,
    setCookieNames: (response.headers.getSetCookie?.() ?? [])
      .map((cookie) => cookie.split("=")[0])
      .filter(Boolean),
    bodySample: text.slice(0, 180).replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN]")
  };
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { redirect: "manual", ...options, signal: controller.signal });
  const text = await response.text();
  return { response, text, summary: summarizeResponse(response, text) };
  } finally {
    clearTimeout(timeout);
  }
}

async function dbChecks(prisma) {
  const adminEmail = process.env.SALORA_ADMIN_BOOTSTRAP_EMAIL?.toLowerCase() ?? "admin@salora.cafe";
  const [
    usersCount,
    adminRole,
    adminUsers,
    duplicateAdminUsers,
    productCount,
    categoryCount,
    imageCount,
    draftCount,
    targetProducts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.role.findUnique({ where: { name: "ADMIN" } }),
    prisma.user.findMany({
      where: { roles: { some: { role: { name: "ADMIN" } } } },
      select: { id: true, email: true, isActive: true, roles: { include: { role: true } } }
    }),
    prisma.user.groupBy({ by: ["email"], where: { email: adminEmail }, _count: { email: true }, having: { email: { _count: { gt: 1 } } } }).catch(() => []),
    prisma.catalogProduct.count(),
    prisma.productCategory.count(),
    prisma.productImage.count({ where: { deletedAt: null } }),
    prisma.productMediaDraft.count({ where: { archivedAt: null } }),
    prisma.catalogProduct.findMany({
      where: { name: { equals: "American cheese cake", mode: "insensitive" } },
      include: {
        images: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        mediaDrafts: { where: { archivedAt: null }, orderBy: [{ createdAt: "desc" }] }
      }
    })
  ]);

  const adminUser = adminUsers.find((user) => user.email.toLowerCase() === adminEmail) ?? null;
  const rotationConfig = adminUser
    ? await prisma.runtimeConfiguration.findFirst({
        where: { scope: "APP", key: `admin.password_rotation_required.${adminUser.id}`, isActive: true },
        select: { key: true, value: true, isActive: true }
      })
    : null;

  const targetProduct = targetProducts[0] ?? null;

  return {
    phaseE: {
      usersCount,
      adminUsersCount: adminUsers.length,
      adminRoleExists: Boolean(adminRole),
      adminUserHasAdminRole: Boolean(adminUser?.roles.some((entry) => entry.role.name === "ADMIN")),
      adminUserActive: Boolean(adminUser?.isActive),
      duplicateAdminUsersCount: duplicateAdminUsers.length,
      adminEmail
    },
    contentDb: {
      productCount,
      categoryCount,
      imageCount,
      draftCount
    },
    targetProduct: targetProduct
      ? {
          exists: true,
          slug: targetProduct.slug,
          status: targetProduct.status,
          imageCount: targetProduct.images.length,
          primaryImageCount: targetProduct.images.filter((image) => image.isPrimary).length,
          draftCount: targetProduct.mediaDrafts.length,
          publishableDraftCount: targetProduct.mediaDrafts.filter((draft) => draft.status === "APPROVED" && (draft.storagePath || draft.publicUrl)).length,
          hasRealImageReference: targetProduct.images.some((image) => Boolean(image.storagePath || image.publicUrl))
        }
      : { exists: false },
    rotation: {
      required: Boolean(rotationConfig && typeof rotationConfig.value === "object" && rotationConfig.value?.required === true),
      keyPresent: Boolean(rotationConfig)
    }
  };
}

async function waitForServer(baseUrl, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await fetchText(`${baseUrl}/api/health`);
      if (result.response.status < 500) return true;
    } catch {}
    await delay(1500);
  }
  return false;
}

async function httpChecks() {
  const port = process.env.CERT_PORT ?? "3100";
  const useExistingServer = process.argv.includes("--http-existing");
  const baseUrl = process.env.CERT_BASE_URL ?? (useExistingServer ? "http://127.0.0.1:3000" : `http://127.0.0.1:${port}`);
  const nodeTool = "C:\\dev\\.tools\\node-v22.22.3-win-x64\\corepack.cmd";
  const server = useExistingServer ? null : spawn("cmd.exe", ["/c", nodeTool, "pnpm", "--filter", "@salora/web", "exec", "next", "dev", "-p", port], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  const logs = [];
  const collect = (chunk) => {
    const text = chunk.toString().replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED_URL]");
    logs.push(text.slice(0, 1000));
    if (logs.length > 20) logs.shift();
  };
  server?.stdout.on("data", collect);
  server?.stderr.on("data", collect);

  try {
    const ready = await waitForServer(baseUrl, useExistingServer ? 8_000 : 90_000);
    if (!ready) {
      return { baseUrl, serverReady: false, serverLogsSample: logs.join("").slice(-1200) };
    }

    if (process.argv.includes("--http-smoke")) {
      const health = await fetchText(`${baseUrl}/api/health`);
      return {
        baseUrl,
        serverReady: true,
        health: health.summary,
        serverLogsSample: logs.join("").slice(-1200)
      };
    }

    const loginPage = await fetchText(`${baseUrl}/login`);
    const loginEndpointGet = await fetchText(`${baseUrl}/api/auth/login`);
    const login = await fetchText(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: process.env.SALORA_ADMIN_BOOTSTRAP_EMAIL,
        password: process.env.SALORA_ADMIN_BOOTSTRAP_PASSWORD
      })
    });

    const setCookies = login.response.headers.getSetCookie?.() ?? [];
    const accessCookie = setCookies.find((cookie) => cookie.startsWith("salora_access_token="));
    const cookieHeader = setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
    const token = accessCookie ? accessCookie.split(";")[0].slice("salora_access_token=".length) : null;

    const meCookie = cookieHeader ? await fetchText(`${baseUrl}/api/auth/me`, { headers: { cookie: cookieHeader } }) : null;
    const meBearer = token ? await fetchText(`${baseUrl}/api/auth/me`, { headers: { authorization: `Bearer ${token}` } }) : null;

    if (process.argv.includes("--http-login-only")) {
      return {
        baseUrl,
        serverReady: true,
        loginPage: loginPage.summary,
        loginEndpointGet: loginEndpointGet.summary,
        login: login.summary,
        httpOnlyCookieNames: setCookies
          .filter((cookie) => /HttpOnly/i.test(cookie))
          .map((cookie) => cookie.split("=")[0]),
        meCookie: meCookie?.summary ?? null,
        meBearer: meBearer?.summary ?? null,
        serverLogsSample: logs.join("").slice(-1200)
      };
    }

    const controlPaths = ["/control-tower", "/control-tower/content", "/control-tower/ai", "/control-tower/revenue", "/control-tower/orders", "/control-tower/settings"];
    const unauthenticatedControl = {};
    const authenticatedControl = {};
    for (const path of controlPaths) {
      unauthenticatedControl[path] = (await fetchText(`${baseUrl}${path}`)).summary;
      authenticatedControl[path] = cookieHeader ? (await fetchText(`${baseUrl}${path}`, { headers: { cookie: cookieHeader } })).summary : null;
    }

    const contentApis = {};
    for (const path of [
      "/api/control-tower/simple-launch/products?limit=5",
      "/api/control-tower/simple-launch/products?limit=1&offset=1",
      "/api/control-tower/simple-launch/categories",
      "/api/control-tower/media",
      "/api/control-tower/media?productSlug=american-cheese-cake"
    ]) {
      contentApis[path] = token ? (await fetchText(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } })).summary : null;
    }

    return {
      baseUrl,
      serverReady: true,
      loginPage: loginPage.summary,
      loginEndpointGet: loginEndpointGet.summary,
      login: login.summary,
      httpOnlyCookieNames: setCookies
        .filter((cookie) => /HttpOnly/i.test(cookie))
        .map((cookie) => cookie.split("=")[0]),
      meCookie: meCookie?.summary ?? null,
      meBearer: meBearer?.summary ?? null,
      unauthenticatedControl,
      authenticatedControl,
      contentApis,
      serverLogsSample: logs.join("").slice(-1200)
    };
  } finally {
    server?.kill();
    if (server) await delay(1000);
  }
}

loadEnv();

const result = {
  generatedAt: new Date().toISOString(),
  db: null,
  http: null,
  errors: []
};

const mode = process.argv.includes("--db-only") ? "db" : process.argv.includes("--http-only") ? "http" : "all";

if (mode === "db" || mode === "all") {
  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs"),
    import("../packages/backend/src/database/generated/client.ts")
  ]);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrlWithTimeout() }) });
  try {
    result.db = await withTimeout(dbChecks(prisma), 45_000, "dbChecks");
  } catch (error) {
    result.errors.push({ phase: "db", message: safeError(error) });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

if (mode === "http" || mode === "all") {
  try {
    result.http = await withTimeout(httpChecks(), 120_000, "httpChecks");
  } catch (error) {
    result.errors.push({ phase: "http", message: safeError(error) });
  }
}

console.log(JSON.stringify(result, null, 2).replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED_URL]"));
