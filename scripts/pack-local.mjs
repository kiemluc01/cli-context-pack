import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(root, "releases");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

await mkdir(destination, { recursive: true });

await new Promise((resolvePromise, reject) => {
  const child = spawn(npm, ["run", "build"], { cwd: root, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => {
    if (code === 0) resolvePromise();
    else reject(new Error(`Build failed with exit code ${code}`));
  });
});

await new Promise((resolvePromise, reject) => {
  const child = spawn(npm, ["pack", "--pack-destination", destination], { cwd: root, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => {
    if (code === 0) resolvePromise();
    else reject(new Error(`Packing failed with exit code ${code}`));
  });
});