import { readdir, readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const pattern = /VERCEL_TOKEN|SUPABASE_SERVICE_ROLE|service_role|Authorization:\s*Bearer|x-vercel-trusted-oidc-idp-token|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|ghp_[A-Za-z0-9]+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/i;
let count = 0;
async function inspect(path) {
  let info;
  try { info = await stat(path); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  if (info.isDirectory()) { for (const name of await readdir(path)) await inspect(path + "/" + name); return; }
  // Never upload opaque archives/HAR: text scanning cannot prove their safety.
  if (/\.(zip|gz|har|webm)$/i.test(path)) throw new Error("UNSAFE_ARTIFACT_FORMAT");
  const content = await readFile(path);
  if (pattern.test(content.toString("utf8"))) throw new Error("CREDENTIAL_ARTIFACT_REJECTED");
  const token = process.env.VERCEL_TRUSTED_OIDC_TOKEN;
  if (token && content.includes(Buffer.from(token))) throw new Error("CREDENTIAL_ARTIFACT_REJECTED");
  // Playwright embeds a ZIP in its HTML report; scan decompressed entries too.
  for (const match of content.toString("utf8").matchAll(/data:application\/zip;base64,([A-Za-z0-9+/=]+)/g)) {
    const entries = execFileSync("python3", ["-c", `
import sys,io,zipfile,json,base64
z=zipfile.ZipFile(io.BytesIO(base64.b64decode(sys.stdin.buffer.read(),validate=True)))
if sum(x.file_size for x in z.infolist()) > 50000000: raise ValueError('limit')
if any(x.filename.lower().endswith(('.zip','.har','.gz')) for x in z.infolist()): raise ValueError('nested archive')
print(json.dumps([base64.b64encode(z.read(x)).decode() for x in z.infolist()]))
`], { input: match[1], maxBuffer: 70000000, stdio: ["pipe", "pipe", "pipe"] });
    for (const entry of JSON.parse(entries)) {
      const decoded = Buffer.from(entry, "base64");
      if (pattern.test(decoded.toString("utf8")) || (token && decoded.includes(Buffer.from(token)))) throw new Error("CREDENTIAL_ARTIFACT_REJECTED");
    }
  }
  count++;
}
try {
  for (const path of ["certification", "playwright-report", "test-results", "ux01-performance-results.json", "ux01-performance-results.md"]) await inspect(path);
  if (!count) throw new Error("ARTIFACTS_MISSING");
  console.log("Artifact safety scan completed without printing file contents.");
} catch { console.error("ARTIFACT_SAFETY_FAILED"); process.exitCode = 1; }
