import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const run = spawnSync(command, ["audit", "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024
});
if (run.error) throw run.error;

let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  throw new Error(`pnpm audit did not return JSON (exit ${run.status ?? "unknown"}): ${run.stderr.slice(0, 500)}`);
}

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const compact = [];

if (report.advisories && typeof report.advisories === "object") {
  for (const advisory of Object.values(report.advisories)) {
    if ((severityRank[advisory.severity] ?? 0) < severityRank.high) continue;
    compact.push({
      package: advisory.module_name,
      severity: advisory.severity,
      title: advisory.title,
      url: advisory.url,
      vulnerableVersions: advisory.vulnerable_versions,
      patchedVersions: advisory.patched_versions,
      recommendation: advisory.recommendation,
      paths: [...new Set((advisory.findings ?? []).flatMap((finding) => finding.paths ?? []))].sort()
    });
  }
} else if (report.vulnerabilities && typeof report.vulnerabilities === "object") {
  for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
    if ((severityRank[vulnerability.severity] ?? 0) < severityRank.high) continue;
    const via = Array.isArray(vulnerability.via) ? vulnerability.via : [];
    compact.push({
      package: name,
      severity: vulnerability.severity,
      title: via.find((item) => item && typeof item === "object")?.title ?? null,
      url: via.find((item) => item && typeof item === "object")?.url ?? null,
      range: vulnerability.range ?? null,
      nodes: vulnerability.nodes ?? [],
      via: via.map((item) => typeof item === "string" ? item : item?.source ?? item?.name ?? item?.title).filter(Boolean),
      fixAvailable: vulnerability.fixAvailable ?? null
    });
  }
}

compact.sort((left, right) =>
  (severityRank[right.severity] ?? 0) - (severityRank[left.severity] ?? 0)
  || String(left.package).localeCompare(String(right.package))
);

console.log(JSON.stringify({
  result: "DEPENDENCY_AUDIT_INVENTORY_ONLY",
  warning: "Inventory is evidence for reachability review, not a waiver and not a passing High-severity gate.",
  generatedAt: new Date().toISOString(),
  auditExitCode: run.status,
  totals: report.metadata?.vulnerabilities ?? report.metadata ?? null,
  highOrCriticalAdvisories: compact
}, null, 2));
