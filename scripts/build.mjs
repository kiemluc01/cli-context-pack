import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const entry = join(dist, "bin.js");
const skillsDir = join(root, "assets", "skills");

await access(entry, constants.R_OK);

/**
 * Parse a SKILL.md front matter block without a YAML dependency.
 * Only the shape ctxpack ships is accepted: `---`, `key: value` lines, `---`.
 * Returns null when the file has no front matter at all.
 */
function parseFrontMatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return null;
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) return null;
  const fields = {};
  for (const line of normalized.slice(4, end + 1).split("\n")) {
    if (line.trim() === "") continue;
    const sep = line.indexOf(":");
    if (sep === -1) throw new Error(`front matter line is not "key: value": ${line}`);
    fields[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }
  return fields;
}

/**
 * A skill is only discoverable if its entry point carries front matter: the agent
 * selects skills by `description` alone. 0.3.0 shipped an entry point with none
 * (the asset map was installed as SKILL.md), so the skill never triggered.
 * These assertions are the regression guard - keep them failing loudly.
 */
async function validateSkill(name) {
  const file = join(skillsDir, name, "SKILL.md");
  await access(file, constants.R_OK);
  const text = await readFile(file, "utf8");

  const fm = parseFrontMatter(text);
  if (fm === null) {
    throw new Error(
      `assets/skills/${name}/SKILL.md has no front matter. The agent would fall back to the ` +
        `first heading as the description and the skill would never trigger.`
    );
  }
  if (fm.name !== name) {
    throw new Error(`assets/skills/${name}/SKILL.md declares name "${fm.name ?? ""}", expected "${name}".`);
  }
  const description = fm.description ?? "";
  if (description.length < 200) {
    throw new Error(
      `assets/skills/${name}/SKILL.md description is ${description.length} chars. ` +
        `It must state when to use the skill, not just name it (minimum 200).`
    );
  }
  // A plain YAML scalar cannot contain ": "; such a description silently fails to parse.
  if (/:\s/.test(description)) {
    throw new Error(
      `assets/skills/${name}/SKILL.md description contains ": ", which breaks the unquoted ` +
        `YAML scalar. Use " - " or an em dash instead.`
    );
  }
  // If the skill bundles a mandatory pre-implementation gate, the description is the only
  // place that can trigger it. An entry point that omits it ships a gate nothing invokes.
  let gated = true;
  try {
    await access(join(skillsDir, name, "workflows", "context-gate.md"), constants.R_OK);
  } catch {
    gated = false;
  }
  if (gated && !description.includes("context-gate.md")) {
    throw new Error(
      `assets/skills/${name} bundles workflows/context-gate.md but its description never ` +
        `references it, so the gate would never be triggered. Name it in the description.`
    );
  }
  return { name, description: description.length, gated };
}

const skillNames = (await readdir(skillsDir, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (skillNames.length === 0) {
  throw new Error("No bundled skills found in assets/skills/");
}

const skills = [];
for (const name of skillNames) skills.push(await validateSkill(name));

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

for (const s of skills) {
  console.error(`Skill ${s.name}: front matter OK, description ${s.description} chars${s.gated ? ", gate referenced" : ""}.`);
}
console.error(`Validated ${files.length} CLI files and ${skills.length} bundled skill(s).`);
