import { spawn, spawnSync } from "child_process";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const BASE_URL = normalizeBaseUrl(process.env.BASE_URL || "http://127.0.0.1:5000");
const HEALTH_PATH = "/api/health";
const PORT = new URL(BASE_URL).port || "5000";

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}${HEALTH_PATH}`, { method: "GET" });
    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function waitForHealth(baseUrl, timeoutMs = 20000) {
  const startedAt = Date.now();
  while ((Date.now() - startedAt) < timeoutMs) {
    if (await checkHealth(baseUrl)) return true;
    await sleep(500);
  }
  return false;
}

function spawnProcess(command, args, options) {
  const child = spawn(command, args, { shell: true, ...options });
  child.on("error", (error) => {
    console.error(`Failed to start ${command}:`, error.message);
  });
  return child;
}

function killProcessTree(child) {
  if (!child || !child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: true
    });
    return;
  }
  child.kill();
}

async function main() {
  let serverProcess = null;
  let launchedServer = false;

  if (!(await checkHealth(BASE_URL))) {
    console.log(`Pages dev not running at ${BASE_URL}. Building and launching local Pages runtime...`);
    await new Promise((resolve, reject) => {
      const buildProcess = spawnProcess("npm", ["run", "cf:build"], {
        cwd: process.cwd(),
        stdio: "inherit",
        env: { ...process.env }
      });
      buildProcess.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Build failed with code ${code}`)));
    });
    serverProcess = spawnProcess("wrangler", ["pages", "dev", "dist", "--port", PORT, "--ip", "127.0.0.1"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env }
    });
    launchedServer = true;
    const healthy = await waitForHealth(BASE_URL);
    if (!healthy) {
      console.error("Backend did not become healthy in time. Aborting smoke checks.");
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  const smokeProcess = spawnProcess("node", ["scripts/smoke-check.mjs"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env }
  });

  const shutdown = (code) => {
    if (launchedServer && serverProcess) {
      killProcessTree(serverProcess);
    }
    process.exit(code ?? 1);
  };

  smokeProcess.on("exit", (code) => shutdown(code));
  smokeProcess.on("close", (code) => shutdown(code));

  process.on("SIGINT", () => shutdown(130));
  process.on("SIGTERM", () => shutdown(143));
}

main().catch((error) => {
  console.error("Smoke runner failed:", error.message);
  process.exit(1);
});
