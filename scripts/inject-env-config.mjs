import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const workspaceDir = process.cwd();
const rootDir = process.env.ZO2Y_INJECT_ROOT_DIR
  ? path.resolve(process.env.ZO2Y_INJECT_ROOT_DIR)
  : workspaceDir;

// Environment variables to inject into frontend JavaScript
function optional(name) {
  return process.env[name] ?? "";
}

function fallback(name, value) {
  const normalized = String(value || "").trim();
  if (normalized) return normalized;
  if (name === "SUPABASE_URL") return "https://gfkhjbztayjyojsgdpgk.supabase.co";
  if (name === "SUPABASE_PROJECT_REF") return "gfkhjbztayjyojsgdpgk";
  if (name === "SUPABASE_ANON_KEY") return "sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd";
  return "";
}

const ENV_REPLACEMENTS = {
  SUPABASE_URL: fallback("SUPABASE_URL", optional("SUPABASE_URL")),
  SUPABASE_ANON_KEY: fallback("SUPABASE_ANON_KEY", optional("SUPABASE_ANON_KEY")),
  SUPABASE_PROJECT_REF: fallback("SUPABASE_PROJECT_REF", optional("SUPABASE_PROJECT_REF"))
};

async function injectEnvConfig(filePath) {
  try {
    let content = await readFile(filePath, "utf-8");
    
    // Replace __PLACEHOLDER__ patterns with actual values
    content = content.replace(/__SUPABASE_URL__/g, ENV_REPLACEMENTS.SUPABASE_URL);
    content = content.replace(/__SUPABASE_ANON_KEY__/g, ENV_REPLACEMENTS.SUPABASE_ANON_KEY);
    content = content.replace(/__SUPABASE_PROJECT_REF__/g, ENV_REPLACEMENTS.SUPABASE_PROJECT_REF);
    
    await writeFile(filePath, content, "utf-8");
    console.log(`Injected env config into: ${path.relative(workspaceDir, filePath)}`);
  } catch (error) {
    console.error(`Failed to inject env config into ${filePath}:`, error.message);
  }
}

async function main() {
  const filesToProcess = [
    path.join(rootDir, "js", "auth-gate.js"),
    path.join(rootDir, "travel.html"),
    path.join(rootDir, "js", "pages", "team.js"),
    path.join(rootDir, "js", "pages", "sports.js"),
    path.join(rootDir, "js", "pages", "restraunts.js"),
    path.join(rootDir, "js", "pages", "restaurant.js"),
    path.join(rootDir, "js", "pages", "profile.js"),
    path.join(rootDir, "js", "pages", "index.js")
  ];

  for (const file of filesToProcess) {
    await injectEnvConfig(file);
  }

  console.log("Environment config injection complete.");
}

main().catch(console.error);
