import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();

// Environment variables to inject into frontend JavaScript
const ENV_REPLACEMENTS = {
  SUPABASE_URL: process.env.SUPABASE_URL || "https://gfkhjbztayjyojsgdpgk.supabase.co",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd",
  SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF || "gfkhjbztayjyojsgdpgk"
};

async function injectEnvConfig(filePath) {
  try {
    let content = await readFile(filePath, "utf-8");
    
    // Replace __PLACEHOLDER__ patterns with actual values
    content = content.replace(/__SUPABASE_URL__/g, ENV_REPLACEMENTS.SUPABASE_URL);
    content = content.replace(/__SUPABASE_ANON_KEY__/g, ENV_REPLACEMENTS.SUPABASE_ANON_KEY);
    content = content.replace(/__SUPABASE_PROJECT_REF__/g, ENV_REPLACEMENTS.SUPABASE_PROJECT_REF);
    
    await writeFile(filePath, content, "utf-8");
    console.log(`Injected env config into: ${path.relative(rootDir, filePath)}`);
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
