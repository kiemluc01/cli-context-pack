import { createHash } from "node:crypto";
import { chmodSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, unlinkSync, writeFileSync, } from "node:fs";
import path from "node:path";
/** Resolve a project-relative POSIX path against the project root. */
export const toAbs = (root, rel) => path.resolve(root, ...rel.split("/"));
export const toPosix = (p) => p.split(path.sep).join("/");
/**
 * SHA-256 over content with CRLF normalized to LF (and nothing else), so a
 * Windows checkout with autocrlf hashes the same as a POSIX one.
 */
export function normalizedHash(content) {
    const normalized = Buffer.from(content.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
    return "sha256:" + createHash("sha256").update(normalized).digest("hex");
}
export function lstatOrNull(abs) {
    try {
        return lstatSync(abs);
    }
    catch {
        return null;
    }
}
export function readTextOrNull(abs) {
    const st = lstatOrNull(abs);
    return st?.isFile() ? readFileSync(abs, "utf8") : null;
}
/** Recursively list regular files as sorted POSIX paths relative to dir (symlinks are not followed). */
export function listFiles(dir) {
    const out = [];
    const walk = (abs, rel) => {
        for (const entry of readdirSync(abs, { withFileTypes: true })) {
            const childRel = rel ? `${rel}/${entry.name}` : entry.name;
            if (entry.isDirectory())
                walk(path.join(abs, entry.name), childRel);
            else if (entry.isFile())
                out.push(childRel);
        }
    };
    walk(dir, "");
    return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
/** Write via temp file + rename so an interrupted run never leaves a half-written file. */
export function atomicWrite(abs, content, executable) {
    mkdirSync(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.ctxpack-tmp-${process.pid}`;
    const mode = executable ? 0o755 : 0o644;
    writeFileSync(tmp, content, { mode });
    if (process.platform !== "win32")
        chmodSync(tmp, mode);
    renameSync(tmp, abs);
}
/** Remove a symlink (file or directory link) without touching its target. */
export function removeLink(abs) {
    try {
        unlinkSync(abs);
    }
    catch {
        rmdirSync(abs); // Windows directory symlinks and junctions
    }
}
export function removeTree(abs) {
    rmSync(abs, { recursive: true, force: true });
}
/** Delete a file, then prune now-empty parent directories up to (not including) stopAt. */
export function removeFile(abs, stopAt) {
    rmSync(abs, { force: true });
    let dir = path.dirname(abs);
    while (dir.startsWith(stopAt) && dir !== stopAt) {
        try {
            if (readdirSync(dir).length > 0)
                break;
            rmdirSync(dir);
        }
        catch {
            break;
        }
        dir = path.dirname(dir);
    }
}
