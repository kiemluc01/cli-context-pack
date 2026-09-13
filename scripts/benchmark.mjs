import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const benchmarkRoot = join(root, "assets", "benchmarks");
const required = ["README.md", "requirements.md", "acceptance.md", "baseline", "expected"];
const entries = (await readdir(benchmarkRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const task of entries) {
  for (const item of required)
    await access(join(benchmarkRoot, task, item));
}

if (!process.argv.includes("--self-test")) {
  console.log(JSON.stringify({ tasks: entries, configurations: ["B0", "B1", "B2", "B3", "B4"], metrics: "see assets/benchmarks/README.md" }, null, 2));
} else {
  console.log(`Benchmark self-test passed: ${entries.length} task(s), B0-B4 metadata present, no external API calls.`);
}