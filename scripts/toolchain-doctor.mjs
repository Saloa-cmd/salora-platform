import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const enforce = process.argv.includes("--enforce");
const root = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const recommendedNode = readFileSync(new URL("../.node-version", import.meta.url), "utf8").trim();
const expectedPnpm = String(packageJson.packageManager ?? "").split("@")[1] ?? "";
const issues = [];
const warnings = [];

function major(version) {
  const match = String(version).match(/v?(\d+)\./);
  return match ? Number(match[1]) : Number.NaN;
}

function commandOutput(command, args = []) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }).trim();
  } catch (error) {
    return `unavailable (${error instanceof Error ? error.message.split("\n")[0] : "unknown error"})`;
  }
}

const runtimeNode = process.version;
const runtimePath = process.execPath;
const userAgent = process.env.npm_config_user_agent ?? "";
const pnpmHostNode = userAgent.match(/node\/v?([^\s]+)/)?.[1] ?? "unknown";
const pnpmFromUserAgent = userAgent.match(/pnpm\/([^\s]+)/)?.[1] ?? "unknown";
const pnpmVersion = commandOutput(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["--version"]);
const nodeLocations = process.platform === "win32"
  ? commandOutput("where.exe", ["node"])
  : commandOutput("which", ["-a", "node"]);
const pnpmLocations = process.platform === "win32"
  ? commandOutput("where.exe", ["pnpm"])
  : commandOutput("which", ["-a", "pnpm"]);

if (major(runtimeNode) !== 22) {
  issues.push(`The active node executable must be Node 22.x, found ${runtimeNode} at ${runtimePath}.`);
}
if (pnpmHostNode !== "unknown" && major(pnpmHostNode) !== 22) {
  issues.push(`pnpm itself is running under Node ${pnpmHostNode}; it must run under Node 22.x.`);
}
if (expectedPnpm && pnpmVersion !== expectedPnpm) {
  issues.push(`pnpm must be ${expectedPnpm}, found ${pnpmVersion}.`);
}
if (pnpmFromUserAgent !== "unknown" && expectedPnpm && pnpmFromUserAgent !== expectedPnpm) {
  warnings.push(`pnpm user-agent reports ${pnpmFromUserAgent}, while package.json pins ${expectedPnpm}.`);
}
if (!String(runtimeNode).startsWith(`v${recommendedNode}`)) {
  warnings.push(`Recommended local Node is ${recommendedNode}; current executable is ${runtimeNode}.`);
}

console.log("SALORA toolchain doctor");
console.log(`- project: ${root}`);
console.log(`- active Node: ${runtimeNode}`);
console.log(`- active Node path: ${runtimePath}`);
console.log(`- pnpm: ${pnpmVersion}`);
console.log(`- pnpm host Node: ${pnpmHostNode}`);
console.log(`- package manager pin: ${packageJson.packageManager}`);
console.log("- node locations:");
console.log(nodeLocations.split(/\r?\n/).map((line) => `    ${line}`).join("\n"));
console.log("- pnpm locations:");
console.log(pnpmLocations.split(/\r?\n/).map((line) => `    ${line}`).join("\n"));

for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const issue of issues) console.error(`ERROR: ${issue}`);

if (issues.length > 0) {
  console.error("\nRun scripts/fix-salora-node22-path.ps1 in PowerShell, restart the terminal, then rerun pnpm doctor:toolchain.");
  if (enforce) process.exit(1);
} else {
  console.log("\nSALORA toolchain is compliant: Node 22 and the pinned pnpm version are active.");
}
