import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baselineRoot = resolve(process.env.SALORA_BASELINE_ROOT ?? "../salora-baseline");
const candidateRoot = resolve(process.env.SALORA_CANDIDATE_ROOT ?? ".");
const runs = Number(process.env.SALORA_PERFORMANCE_RUNS ?? "3");
const routes = ["/", "/menu"];
const environments = [
  { name: "baseline", root: baselineRoot, port: 3111 },
  { name: "candidate", root: candidateRoot, port: 3112 }
];

function startServer({ root, port }) {
  const child = spawn(
    "pnpm",
    ["--filter", "@salora/web", "exec", "next", "start", "-H", "127.0.0.1", "-p", String(port)],
    { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] }
  );
  let output = "";
  child.stdout.on("data", (chunk) => { output += String(chunk); });
  child.stderr.on("data", (chunk) => { output += String(chunk); });
  return { child, output: () => output.slice(-4000) };
}

async function waitForServer(port) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, { cache: "no-store" });
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`Server on port ${port} did not become healthy within 120 seconds.`);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(samples, field) {
  const values = samples.map((sample) => Number(sample[field]));
  return {
    median: Math.round(median(values) * 100) / 100,
    min: Math.round(Math.min(...values) * 100) / 100,
    max: Math.round(Math.max(...values) * 100) / 100
  };
}

async function measureRoute(browser, baseUrl, route) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    locale: "ar-OM",
    timezoneId: "Asia/Muscat",
    reducedMotion: "reduce",
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 75,
    downloadThroughput: 625_000,
    uploadThroughput: 187_500,
    connectionType: "cellular4g"
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.addInitScript(() => {
    window.__saloraLabVitals = { lcp: 0, cls: 0, lcpElement: null };
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries.at(-1);
      if (!last) return;
      window.__saloraLabVitals.lcp = last.startTime;
      const element = last.element;
      window.__saloraLabVitals.lcpElement = element
        ? `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className && typeof element.className === "string" ? `.${element.className.trim().split(/\s+/).join(".")}` : ""}`
        : null;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__saloraLabVitals.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  const resourceReads = [];
  let requestCount = 0;
  let jsBytes = 0;
  let imageBytes = 0;
  page.on("response", (response) => {
    requestCount += 1;
    const type = response.request().resourceType();
    if (type !== "script" && type !== "image") return;
    resourceReads.push(response.body().then((body) => {
      if (type === "script") jsBytes += body.byteLength;
      if (type === "image") imageBytes += body.byteLength;
    }).catch(() => {}));
  });

  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 120_000 });
  if (!response || response.status() >= 500) {
    throw new Error(`${baseUrl}${route} returned ${response?.status() ?? "no response"}.`);
  }
  await page.waitForTimeout(1_000);
  await Promise.all(resourceReads);
  const htmlBytes = (await response.body()).byteLength;
  const vitals = await page.evaluate(() => window.__saloraLabVitals);
  await context.close();

  return {
    lcpMs: vitals.lcp,
    cls: vitals.cls,
    lcpElement: vitals.lcpElement,
    htmlBytes,
    jsBytes,
    imageBytes,
    requestCount
  };
}

const servers = environments.map((environment) => ({
  ...environment,
  process: startServer(environment)
}));

try {
  await Promise.all(servers.map((server) => waitForServer(server.port)));
  const browser = await chromium.launch({ headless: true });
  const raw = {};
  try {
    for (const environment of servers) {
      raw[environment.name] = {};
      for (const route of routes) {
        raw[environment.name][route] = [];
        for (let run = 0; run < runs; run += 1) {
          raw[environment.name][route].push(
            await measureRoute(browser, `http://127.0.0.1:${environment.port}`, route)
          );
        }
      }
    }
  } finally {
    await browser.close();
  }

  const summary = {};
  for (const route of routes) {
    summary[route] = {};
    for (const name of ["baseline", "candidate"]) {
      const samples = raw[name][route];
      summary[route][name] = {
        lcpMs: summarize(samples, "lcpMs"),
        cls: summarize(samples, "cls"),
        htmlBytes: summarize(samples, "htmlBytes"),
        jsBytes: summarize(samples, "jsBytes"),
        imageBytes: summarize(samples, "imageBytes"),
        requestCount: summarize(samples, "requestCount"),
        lcpElements: [...new Set(samples.map((sample) => sample.lcpElement))]
      };
    }
    summary[route].delta = {
      lcpMs: summary[route].candidate.lcpMs.median - summary[route].baseline.lcpMs.median,
      cls: summary[route].candidate.cls.median - summary[route].baseline.cls.median,
      htmlBytes: summary[route].candidate.htmlBytes.median - summary[route].baseline.htmlBytes.median,
      jsBytes: summary[route].candidate.jsBytes.median - summary[route].baseline.jsBytes.median,
      imageBytes: summary[route].candidate.imageBytes.median - summary[route].baseline.imageBytes.median,
      requestCount: summary[route].candidate.requestCount.median - summary[route].baseline.requestCount.median
    };
  }

  const result = {
    methodology: {
      label: "LAB",
      runs,
      statistic: "median with min/max",
      cache: "new browser context per run; HTTP cache disabled; service workers blocked",
      viewport: "412x915 at 2.625 DPR; touch/mobile",
      locale: "ar-OM",
      timezone: "Asia/Muscat",
      reducedMotion: true,
      network: "75ms RTT; 5Mbps down; 1.5Mbps up",
      cpu: "4x slowdown",
      environment: "two isolated Next.js production servers on the same GitHub-hosted runner"
    },
    refs: {
      baseline: process.env.SALORA_BASELINE_SHA ?? "unknown",
      candidate: process.env.GITHUB_SHA ?? "unknown"
    },
    summary,
    raw
  };

  await writeFile("ux01-performance-results.json", `${JSON.stringify(result, null, 2)}\n`);
  const markdown = [
    "# UX-01 Performance Lab",
    "",
    `Runs: ${runs} · Mobile 412×915 · cold cache · 75ms RTT · 5Mbps down · 4× CPU`,
    "",
    "| Route | Metric | Baseline median | Candidate median | Delta |",
    "|---|---:|---:|---:|---:|",
    ...routes.flatMap((route) => [
      `| ${route} | LCP (ms) | ${summary[route].baseline.lcpMs.median} | ${summary[route].candidate.lcpMs.median} | ${summary[route].delta.lcpMs} |`,
      `| ${route} | CLS | ${summary[route].baseline.cls.median} | ${summary[route].candidate.cls.median} | ${summary[route].delta.cls} |`,
      `| ${route} | HTML bytes | ${summary[route].baseline.htmlBytes.median} | ${summary[route].candidate.htmlBytes.median} | ${summary[route].delta.htmlBytes} |`,
      `| ${route} | JS bytes | ${summary[route].baseline.jsBytes.median} | ${summary[route].candidate.jsBytes.median} | ${summary[route].delta.jsBytes} |`,
      `| ${route} | Requests | ${summary[route].baseline.requestCount.median} | ${summary[route].candidate.requestCount.median} | ${summary[route].delta.requestCount} |`,
      `| ${route} | Image bytes | ${summary[route].baseline.imageBytes.median} | ${summary[route].candidate.imageBytes.median} | ${summary[route].delta.imageBytes} |`
    ])
  ].join("\n");
  await writeFile("ux01-performance-results.md", `${markdown}\n`);
  console.log(markdown);

  const regressions = routes.flatMap((route) => {
    const baseline = summary[route].baseline;
    const candidate = summary[route].candidate;
    const problems = [];
    if (candidate.cls.median > 0.1) problems.push(`${route} CLS ${candidate.cls.median} exceeds 0.1`);
    if (candidate.jsBytes.median > baseline.jsBytes.median) problems.push(`${route} JS increased by ${summary[route].delta.jsBytes} bytes`);
    if (candidate.lcpMs.median - baseline.lcpMs.median > Math.max(250, baseline.lcpMs.median * 0.15)) {
      problems.push(`${route} LCP regressed by ${summary[route].delta.lcpMs}ms`);
    }
    return problems;
  });
  if (regressions.length) throw new Error(`UX-01 performance gate failed:\n- ${regressions.join("\n- ")}`);
} finally {
  for (const server of servers) {
    server.process.child.kill("SIGTERM");
    if (server.process.child.exitCode && server.process.child.exitCode !== 0) {
      console.error(server.process.output());
    }
  }
}
