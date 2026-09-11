import { mkdirSync, symlinkSync } from "node:fs";
import path from "node:path";
import { CtxpackError } from "./errors.js";
import { atomicWrite, removeFile, removeLink, removeTree, toAbs } from "./fsutil.js";
/**
 * Apply a plan in order. The planner emits actions in a safe order (removals of a
 * link path before re-creating it, skill files before the lock), so execution is sequential.
 */
export function executePlan(plan) {
    if (plan.conflicts > 0) {
        throw new CtxpackError("CONFLICT", `${plan.conflicts} conflict(s) block this change`, "ctxpack never overwrites local modifications or unmanaged files silently.", 'Resolve the conflicts listed above, or rerun with --force where it is offered.');
    }
    for (const a of plan.actions) {
        switch (a.kind) {
            case "write":
                atomicWrite(toAbs(plan.root, a.path), a.content, a.executable);
                break;
            case "delete": {
                const skillsDir = a.path.split("/").slice(0, 2).join("/");
                removeFile(toAbs(plan.root, a.path), toAbs(plan.root, skillsDir));
                break;
            }
            case "unlink":
                removeLink(toAbs(plan.root, a.path));
                break;
            case "rmtree":
                removeTree(toAbs(plan.root, a.path));
                break;
            case "symlink": {
                const abs = toAbs(plan.root, a.path);
                mkdirSync(path.dirname(abs), { recursive: true });
                symlinkSync(a.target.split("/").join(path.sep), abs, "dir");
                break;
            }
            default:
                break; // conflict, manual, skip, info: informational only
        }
    }
}
