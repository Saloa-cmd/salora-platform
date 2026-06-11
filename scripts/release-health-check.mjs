const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const timeoutMs = Number(process.env.TIMEOUT_MS || 10_000);
const endpoints = ["/api/live", "/api/ready", "/api/health"];

async function checkEndpoint(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(new URL(path, baseUrl), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}`);
    }
    return { path, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

for (const endpoint of endpoints) {
  const result = await checkEndpoint(endpoint);
  console.log(`release-check ${result.path} ${result.status}`);
}
