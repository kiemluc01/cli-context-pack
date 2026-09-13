import { readFile } from "node:fs/promises";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const before = args.get("--before");
const after = args.get("--after");
if (!before || !after) {
  console.error("Usage: npm run context:analyze -- --before before.txt --after after.txt");
  process.exitCode = 2;
} else {
  const measure = async (file) => {
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    const counts = new Map(lines.map((line) => [line, 0]));
    for (const line of lines) counts.set(line, counts.get(line) + 1);
    const skills = [...new Set(lines.filter((line) => /(?:^|\s)SKILL:\s*/i.test(line)))];
    const contexts = [...new Set(lines.filter((line) => /(?:^|\s)CONTEXT:\s*/i.test(line)))];
    return { tokens: Math.ceil(text.length / 4), lines: lines.length, duplicatedLines: [...counts.values()].filter((count) => count > 1).length, skillsLoaded: skills.length, contextFilesLoaded: contexts.length };
  };
  const [oldMetrics, newMetrics] = await Promise.all([measure(before), measure(after)]);
  const reduction = oldMetrics.tokens === 0 ? 0 : ((oldMetrics.tokens - newMetrics.tokens) / oldMetrics.tokens) * 100;
  console.log(JSON.stringify({ before: oldMetrics, after: newMetrics, reductionPercent: Number(reduction.toFixed(1)) }, null, 2));
}