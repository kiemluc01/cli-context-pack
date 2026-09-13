import { readFileSync, readlinkSync } from "node:fs";
import path from "node:path";
import { FILE_RENAMES } from "./bundle.js";
import { CONFIG_PATH, LOCK_PATH, stableJson } from "./config.js";
import { listFiles, lstatOrNull, normalizedHash, readTextOrNull, toAbs } from "./fsutil.js";
import { hookEnvironment } from "./git.js";
import { MCP_CONFIG_PATH, MCP_SERVER_NAME, MCP_SERVER_CONFIG, desiredMcpConfig } from "./mcp.js";
export const MARK_BEGIN = "# >>> ctxpack managed block (do not edit) >>>";
export const MARK_END = "# <<< ctxpack managed block <<<";
export const SHIM_MARKER = "# managed-by: ctxpack";
export const CLAUDE_MD_PATH = "CLAUDE.md";
const HOOK_MANAGER_FILES = ["lefthook.yml", ".lefthook.yml", "lefthook.yaml", ".lefthook.yaml", ".pre-commit-config.yaml"];
export const primaryRoot = (skill) => `.agent/skills/${skill}`;
export const claudeRoot = (skill) => `.claude/skills/${skill}`;
/** auto = symlink on POSIX; copy on Windows, where symlinks need Developer Mode and git may check them out as text files. */
export function resolveLinkMode(mode, platform) {
    if (mode === "auto")
        return platform === "win32" ? "copy" : "symlink";
    return mode;
}
export function buildPlan(input) {
    const actions = [];
    const linkMode = resolveLinkMode(input.config.linkMode, input.platform);
    const newLock = { schemaVersion: 1, skills: { ...input.lock.skills } };
    for (const skill of input.skills) {
        const locked = input.lock.skills[skill.name]?.files ?? {};
        syncTree(primaryRoot(skill.name), skill, locked, input, actions, false);
        if (input.config.targets.includes("claude"))
            planClaudeTarget(skill, locked, linkMode, input, actions);
        newLock.skills[skill.name] = {
            version: skill.version,
            files: Object.fromEntries(skill.files.map((f) => [f.rel, f.hash])),
        };
    }
    for (const r of input.renamed ?? []) {
        planLegacyRemoval(r, input, actions);
        delete newLock.skills[r.from];
    }
    if (input.isGit) {
        planGitattributes(input, linkMode, actions);
        if (input.config.hooks.preCommit)
            planPreCommitHook(input, actions);
    }
    else {
        actions.push({ kind: "skip", subject: "git integration", detail: "Not a git repository: .gitattributes and the pre-commit hook were skipped. Run \"ctxpack apply\" again after \"git init\"." });
    }
    if (input.config.targets.includes("claude"))
        planClaudeMd(input, actions);
    if (input.writeConfig)
        planTextFile(input.root, CONFIG_PATH, stableJson(input.config), actions);
    planMcpConfig(input, actions);
    planTextFile(input.root, LOCK_PATH, stableJson(newLock), actions);
    const changes = actions.filter((a) => ["write", "delete", "unlink", "rmtree", "symlink"].includes(a.kind)).length;
    const conflicts = actions.filter((a) => a.kind === "conflict").length;
    return { root: input.root, linkMode, actions, changes, conflicts };
}
function planMcpConfig(input, actions) {
    let desired;
    try {
        desired = desiredMcpConfig(input.root, input.force);
    }
    catch (error) {
        actions.push({ kind: "conflict", path: MCP_CONFIG_PATH, code: error.code, detail: error.message, fix: error.fix });
        return;
    }
    if (desired.conflict) {
        actions.push({ kind: "conflict", path: MCP_CONFIG_PATH, code: "CONFLICT", detail: `MCP server "${MCP_SERVER_NAME}" already exists with a different configuration.`, fix: `Review ${MCP_CONFIG_PATH}, or rerun "ctxpack apply --force" to use ${MCP_SERVER_CONFIG.url}.` });
    }
    else if (desired.text !== desired.existingText) {
        actions.push({ kind: "write", path: MCP_CONFIG_PATH, content: Buffer.from(desired.text), executable: false, reason: desired.existingText === null ? "create" : "update", note: `configure MCP server ${MCP_SERVER_NAME}` });
    }
}
/**
 * Converge the files under rootRel to the bundled skill.
 * A local file equal to the bundle is left alone; equal to the previously installed (locked)
 * version is updated; anything else is a local modification and is never overwritten without --force.
 */
function syncTree(rootRel, skill, locked, input, actions, assumeEmpty) {
    const posix = input.platform !== "win32";
    for (const f of skill.files) {
        const rel = `${rootRel}/${f.rel}`;
        const abs = toAbs(input.root, rel);
        const st = assumeEmpty ? null : lstatOrNull(abs);
        if (!st) {
            actions.push({ kind: "write", path: rel, content: f.content, executable: f.executable, reason: "create" });
            continue;
        }
        if (!st.isFile()) {
            actions.push({ kind: "conflict", path: rel, code: "CONFLICT", detail: "Expected a regular file but found a directory or link.", fix: `Move ${rel} out of the way, then run "ctxpack apply".` });
            continue;
        }
        const local = normalizedHash(readFileSync(abs));
        if (local === f.hash) {
            if (posix && f.executable && (st.mode & 0o111) === 0) {
                actions.push({ kind: "write", path: rel, content: f.content, executable: true, reason: "update", note: "restore executable bit" });
            }
        }
        else if (local === lockedHash(locked, skill.name, f.rel)) {
            actions.push({ kind: "write", path: rel, content: f.content, executable: f.executable, reason: "update" });
        }
        else if (input.force) {
            actions.push({ kind: "write", path: rel, content: f.content, executable: f.executable, reason: "overwrite", note: "local changes discarded (--force)" });
        }
        else {
            actions.push({ kind: "conflict", path: rel, code: "INTEGRITY_MISMATCH", detail: "Locally modified: content differs from both the installed and the bundled version.", fix: "Keep your change by upstreaming it to the skill, or discard it with --force." });
        }
    }
    const bundled = new Set(skill.files.map((f) => f.rel));
    for (const [fileRel, hash] of Object.entries(locked).sort(([a], [b]) => (a < b ? -1 : 1))) {
        if (bundled.has(fileRel))
            continue;
        const rel = `${rootRel}/${fileRel}`;
        const abs = toAbs(input.root, rel);
        const st = assumeEmpty ? null : lstatOrNull(abs);
        if (!st?.isFile())
            continue;
        if (normalizedHash(readFileSync(abs)) === hash)
            actions.push({ kind: "delete", path: rel, reason: "stale" });
        else if (input.force)
            actions.push({ kind: "delete", path: rel, reason: "overwrite" });
        else
            actions.push({ kind: "conflict", path: rel, code: "INTEGRITY_MISMATCH", detail: "Removed from the new skill version, but modified locally.", fix: "Delete or move it yourself, or use --force." });
    }
}
/** The locked hash for a file, falling back to the path an older lockfile used for it. */
function lockedHash(locked, skillName, rel) {
    if (locked[rel] !== undefined)
        return locked[rel];
    const legacy = FILE_RENAMES[skillName]?.[rel];
    return legacy === undefined ? undefined : locked[legacy];
}
/** A directory is a managed copy when every file in it matches the lock or the bundle and nothing extra exists. */
function isManagedCopy(abs, skill, locked) {
    const bundled = new Map(skill.files.map((f) => [f.rel, f.hash]));
    return listFiles(abs).every((rel) => {
        const h = normalizedHash(readFileSync(path.join(abs, ...rel.split("/"))));
        return h === locked[rel] || h === bundled.get(rel);
    });
}
function planClaudeTarget(skill, locked, mode, input, actions) {
    const rel = claudeRoot(skill.name);
    const abs = toAbs(input.root, rel);
    const target = path.posix.relative(path.posix.dirname(rel), primaryRoot(skill.name));
    const st = lstatOrNull(abs);
    if (mode === "copy") {
        if (st?.isSymbolicLink()) {
            actions.push({ kind: "unlink", path: rel, note: "switching from symlink to copy" });
            syncTree(rel, skill, locked, input, actions, true);
        }
        else if (st && !st.isDirectory()) {
            actions.push({ kind: "conflict", path: rel, code: "CONFLICT", detail: "Expected a directory but found a file.", fix: `Delete ${rel}, then run "ctxpack apply".` });
        }
        else {
            syncTree(rel, skill, locked, input, actions, false);
        }
        return;
    }
    if (!st) {
        actions.push({ kind: "symlink", path: rel, target });
    }
    else if (st.isSymbolicLink()) {
        const current = readlinkSync(abs);
        if (path.resolve(path.dirname(abs), current) === toAbs(input.root, primaryRoot(skill.name)))
            return;
        if (input.force) {
            actions.push({ kind: "unlink", path: rel, note: `was pointing to ${current}` });
            actions.push({ kind: "symlink", path: rel, target });
        }
        else {
            actions.push({ kind: "conflict", path: rel, code: "CONFLICT", detail: `Symlink points to ${current}, not ${target}.`, fix: "Re-point it with --force, or remove it yourself." });
        }
    }
    else if (st.isDirectory() && isManagedCopy(abs, skill, locked)) {
        actions.push({ kind: "rmtree", path: rel, note: "switching from copy to symlink (contents verified unmodified)" });
        actions.push({ kind: "symlink", path: rel, target });
    }
    else if (st.isDirectory()) {
        actions.push({ kind: "conflict", path: rel, code: "CONFLICT", detail: "A directory with unmanaged or modified files already exists here.", fix: `ctxpack never deletes unmanaged files. Move ${rel} away, or set "linkMode": "copy".` });
    }
    else {
        actions.push({ kind: "conflict", path: rel, code: "CONFLICT", detail: "A regular file exists where the skill link belongs (git on Windows checks out symlinks as text files unless core.symlinks=true).", fix: `Delete the file and run "ctxpack apply", or set "linkMode": "copy" in ${CONFIG_PATH}.` });
    }
}
/** Expand-then-contract rename: the new skill is already planned; remove the old managed install. */
function planLegacyRemoval(r, input, actions) {
    actions.push({ kind: "info", subject: "skill renamed", detail: `${r.from} -> ${r.to}: installing ${r.to} and removing the old managed files` });
    const locked = input.lock.skills[r.from]?.files ?? {};
    const none = { name: r.from, version: "", files: [] };
    const oldPrimary = primaryRoot(r.from);
    const leftovers = (rel) => {
        const abs = toAbs(input.root, rel);
        if (!lstatOrNull(abs)?.isDirectory())
            return;
        const unmanaged = listFiles(abs).filter((f) => !(f in locked));
        if (unmanaged.length > 0) {
            actions.push({ kind: "manual", subject: rel, detail: `${unmanaged.length} file(s) not managed by ctxpack remain after the rename.`, fix: `Move anything you need into ${primaryRoot(r.to)}/, then delete ${rel}/.` });
        }
    };
    syncTree(oldPrimary, none, locked, input, actions, false);
    leftovers(oldPrimary);
    const oldLink = claudeRoot(r.from);
    const abs = toAbs(input.root, oldLink);
    const st = lstatOrNull(abs);
    if (st?.isSymbolicLink()) {
        if (path.resolve(path.dirname(abs), readlinkSync(abs)) === toAbs(input.root, oldPrimary)) {
            actions.push({ kind: "unlink", path: oldLink, note: `renamed to ${r.to}` });
        }
        else {
            actions.push({ kind: "manual", subject: oldLink, detail: "Symlink is not managed by ctxpack; left untouched.", fix: `Delete ${oldLink} if it is no longer needed.` });
        }
    }
    else if (st?.isDirectory()) {
        syncTree(oldLink, none, locked, input, actions, false);
        leftovers(oldLink);
    }
}
/** Insert or replace the ctxpack block in a text file; null when the markers are damaged. */
export function upsertBlock(existing, lines) {
    const block = [MARK_BEGIN, ...lines, MARK_END].join("\n");
    if (existing === null || existing === "")
        return block + "\n";
    const begin = existing.indexOf(MARK_BEGIN);
    const end = existing.indexOf(MARK_END);
    if (begin === -1 && end === -1)
        return existing + (existing.endsWith("\n") ? "" : "\n") + block + "\n";
    if (begin === -1 || end === -1 || end < begin)
        return null;
    return existing.slice(0, begin) + block + existing.slice(end + MARK_END.length);
}
function planBlock(root, rel, lines, executable, actions) {
    const existing = readTextOrNull(toAbs(root, rel));
    const next = upsertBlock(existing, lines);
    if (next === null) {
        actions.push({ kind: "conflict", path: rel, code: "CONFLICT", detail: "The ctxpack managed-block markers are damaged.", fix: `Remove the broken "${MARK_BEGIN}" / "${MARK_END}" lines, then run "ctxpack apply".` });
    }
    else if (next !== existing) {
        actions.push({ kind: "write", path: rel, content: Buffer.from(next), executable, reason: existing === null ? "create" : "update" });
    }
}
function planTextFile(root, rel, text, actions) {
    const existing = readTextOrNull(toAbs(root, rel));
    if (existing !== text)
        actions.push({ kind: "write", path: rel, content: Buffer.from(text), executable: false, reason: existing === null ? "create" : "update" });
}
/**
 * Claude Code always reads CLAUDE.md at the project root, so the mandatory gate is announced
 * there rather than relying on the agent choosing to load the skill first. Written as a managed
 * block so a project's own CLAUDE.md content is preserved.
 */
function planClaudeMd(input, actions) {
    const gated = input.skills.filter((s) => s.files.some((f) => f.rel === "workflows/context-gate.md"));
    if (gated.length === 0)
        return;
    const lines = [
        "## Before writing code",
        "",
        "Run the Context Gate first for any non-trivial request: a new project, an empty repo, or a new",
        "feature, screen, page, module, API, CRUD list, management screen, form, dashboard or import/export.",
        "Open the gate with the AskUserQuestion tool - one question per item, selectable options with the",
        "recommended one first - never as a typed question list or a \"reply 1b 2c\" instruction. At most 4",
        "questions per call; ask the rest in a second call right after the first returns.",
        "The gate stays open per question until every numbered item is settled. Stay read-only; if the",
        "answers leave an item unclear (no answer, Other without a value, deferred content, a new",
        "sub-decision), ask a follow-up for that item only and never re-ask a settled one. Once all items",
        "are settled, state the assumptions you are making and start implementing in the same turn - do",
        "not ask the user to confirm a summary first. Only HIGH_RISK work (auth, secrets, data loss,",
        "schema migration, contract break) waits for an explicit go-ahead.",
        "",
        ...gated.flatMap((s) => [
            `- Gate procedure: \`${primaryRoot(s.name)}/workflows/context-gate.md\``,
            `- Pipeline and rules: \`${primaryRoot(s.name)}/SKILL.md\``,
        ]),
    ];
    planBlock(input.root, CLAUDE_MD_PATH, lines, false, actions);
}
/** Keep hook scripts LF on every checkout: a CRLF shell script fails under sh. */
function planGitattributes(input, mode, actions) {
    const lines = [".agent/skills/*/hooks/* text eol=lf"];
    if (mode === "copy" && input.config.targets.includes("claude"))
        lines.push(".claude/skills/*/hooks/* text eol=lf");
    planBlock(input.root, ".gitattributes", lines, false, actions);
}
export function hookCallLines(input) {
    return input.skills
        .filter((s) => s.files.some((f) => f.rel === "hooks/pre-commit"))
        .map((s) => `sh "$(git rev-parse --show-toplevel)/${primaryRoot(s.name)}/hooks/pre-commit" || exit 1`);
}
export function shimContent(calls) {
    return ["#!/bin/sh", `${SHIM_MARKER} (do not edit; "ctxpack apply" rewrites this file)`, "# Runs the Context Pack Registry pre-commit quality gate.", ...calls, ""].join("\n");
}
function planPreCommitHook(input, actions) {
    const calls = hookCallLines(input);
    if (calls.length === 0)
        return;
    const env = hookEnvironment(input.root);
    const huskyPath = env.hooksPath !== null && /^\.husky(\/_)?\/?$/.test(env.hooksPath);
    if (env.hooksPath !== null && !huskyPath) {
        actions.push({ kind: "manual", subject: "pre-commit hook", detail: `core.hooksPath is "${env.hooksPath}", managed by another tool; ctxpack will not change it.`, fix: `Add to ${env.hooksPath}/pre-commit:\n    ${calls.join("\n    ")}` });
        return;
    }
    if (huskyPath || lstatOrNull(toAbs(input.root, ".husky"))?.isDirectory()) {
        planBlock(input.root, ".husky/pre-commit", calls, true, actions);
        return;
    }
    const manager = HOOK_MANAGER_FILES.find((f) => lstatOrNull(toAbs(input.root, f)));
    if (manager) {
        const snippet = manager.includes("pre-commit-config")
            ? `- repo: local\n      hooks:\n        - id: context-pack-registry\n          name: context-pack-registry quality gate\n          entry: sh .agent/skills/context-pack-registry/hooks/pre-commit\n          language: system\n          pass_filenames: false`
            : `pre-commit:\n      commands:\n        context-pack-registry:\n          run: sh .agent/skills/context-pack-registry/hooks/pre-commit`;
        actions.push({ kind: "manual", subject: "pre-commit hook", detail: `${manager} found; ctxpack does not edit another hook manager's config.`, fix: `Add to ${manager}:\n    ${snippet}` });
        return;
    }
    const rel = `${env.hooksDirRel}/pre-commit`;
    const existing = readTextOrNull(toAbs(input.root, rel));
    const desired = shimContent(calls);
    if (existing === null) {
        actions.push({ kind: "write", path: rel, content: Buffer.from(desired), executable: true, reason: "create" });
    }
    else if (existing.includes(SHIM_MARKER)) {
        if (existing !== desired)
            actions.push({ kind: "write", path: rel, content: Buffer.from(desired), executable: true, reason: "update" });
    }
    else {
        actions.push({ kind: "manual", subject: "pre-commit hook", detail: `${rel} already exists and is not managed by ctxpack; it was left untouched.`, fix: `Add to ${rel}:\n    ${calls.join("\n    ")}` });
    }
}
