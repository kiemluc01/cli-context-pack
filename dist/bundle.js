import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CtxpackError } from "./errors.js";
import { listFiles, normalizedHash } from "./fsutil.js";
export const PACKAGE_NAME = "@aristha/ctxpack";
let root;
/** Walk up from this module to the package root (works for dist/ and test builds). */
export function packageRoot() {
    if (root)
        return root;
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (;;) {
        const pj = path.join(dir, "package.json");
        if (existsSync(pj) && JSON.parse(readFileSync(pj, "utf8")).name === PACKAGE_NAME) {
            root = dir;
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new CtxpackError("INVALID_CONFIGURATION", "Bundled assets not found", "The CLI could not locate its own package directory.", `Reinstall ${PACKAGE_NAME}.`);
        }
        dir = parent;
    }
}
export function packageVersion() {
    return JSON.parse(readFileSync(path.join(packageRoot(), "package.json"), "utf8")).version;
}
/**
 * Skills renamed between releases (old id -> new id). A project whose config still uses
 * an old id is migrated by "ctxpack apply": the new skill is installed, then the old
 * managed files are removed (never files the user modified or does not own).
 */
export const SKILL_RENAMES = { "agent-registry": "context-pack-registry" };
/** Deterministic rule: files under hooks/ with no extension or .sh are executable. */
export function isExecutableAsset(rel) {
    if (!rel.startsWith("hooks/"))
        return false;
    const ext = path.posix.extname(rel);
    return ext === "" || ext === ".sh";
}
export function availableSkills() {
    const dir = path.join(packageRoot(), "assets", "skills");
    return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}
export function loadSkill(name) {
    const dir = path.join(packageRoot(), "assets", "skills", name);
    if (!existsSync(path.join(dir, "SKILL.md"))) {
        throw new CtxpackError("SKILL_NOT_FOUND", `Skill "${name}" is not bundled with this CLI`, `Available skills: ${availableSkills().join(", ") || "none"}.`, "Fix the name in .agent/ctxpack.json or upgrade ctxpack.", 2);
    }
    const files = listFiles(dir).map((rel) => {
        const content = readFileSync(path.join(dir, ...rel.split("/")));
        return { rel, content, hash: normalizedHash(content), executable: isExecutableAsset(rel) };
    });
    return { name, version: packageVersion(), files };
}
