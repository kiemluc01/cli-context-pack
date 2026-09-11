import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const entry = join(dist, "bin.js");
const skill = join(root, "assets", "skills", "context-pack-registry", "SKILL.md");

await access(entry, constants.R_OK);
await access(skill, constants.R_OK);

const files = (await readdir(dist))
  .filter((file) => file.endsWith(".js"))
  .map((file) => join(dist, file));

if (files.length === 0) {
  throw new Error("No JavaScript files found in dist/");
}

for (const file of files) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, ["--check", file], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`Syntax check failed for ${file}`));
    });
  });
}

console.error(`Validated ${files.length} CLI files and the bundled skill.`);