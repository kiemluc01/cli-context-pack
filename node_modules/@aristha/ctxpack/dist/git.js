import { execFileSync } from "node:child_process";
import path from "node:path";
import { toPosix } from "./fsutil.js";
/** Run git and return trimmed stdout, or null on any failure (git missing, not a repo, unset key). */
export function git(cwd, args) {
    try {
        return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    }
    catch {
        return null;
    }
}
/** The project root is the git top-level directory when inside a repository, else the given directory. */
export function locateProject(cwd) {
    const top = git(cwd, ["rev-parse", "--show-toplevel"]);
    return top ? { root: path.resolve(top), isGit: true } : { root: path.resolve(cwd), isGit: false };
}
export function hookEnvironment(root) {
    const hooksPath = git(root, ["config", "--get", "core.hooksPath"]) || null;
    const dir = git(root, ["rev-parse", "--git-path", "hooks"]) ?? ".git/hooks";
    return { hooksPath, hooksDirRel: toPosix(path.relative(root, path.resolve(root, dir))) };
}
