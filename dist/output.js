const SKILL_ROOT = /^(\.agent|\.claude)\/skills\/[^/]+/;
/** Action without file contents, for --json output. */
export function describeAction(a) {
    if (a.kind === "write") {
        const { content: _content, ...rest } = a;
        return { ...rest, bytes: a.content.length };
    }
    return { ...a };
}
export function planSummary(plan) {
    const count = (pred) => plan.actions.filter(pred).length;
    return {
        create: count((a) => (a.kind === "write" && a.reason === "create") || a.kind === "symlink"),
        update: count((a) => a.kind === "write" && a.reason !== "create"),
        delete: count((a) => a.kind === "delete" || a.kind === "unlink" || a.kind === "rmtree"),
        conflict: plan.conflicts,
        manual: count((a) => a.kind === "manual"),
    };
}
/** Human-readable plan. Skill files are grouped per directory unless verbose. */
export function renderPlan(plan, io, verbose) {
    const groups = new Map();
    for (const a of plan.actions) {
        const label = actionLabel(a);
        const root = "path" in a ? SKILL_ROOT.exec(a.path)?.[0] : undefined;
        if (!verbose && root && (a.kind === "write" || a.kind === "delete") && !("note" in a && a.note)) {
            const key = `${label}|${root}`;
            groups.set(key, (groups.get(key) ?? 0) + 1);
            continue;
        }
        flushGroups(groups, io);
        io.out(renderAction(a));
    }
    flushGroups(groups, io);
}
function flushGroups(groups, io) {
    for (const [key, n] of groups) {
        const [label, root] = key.split("|");
        io.out(`  ${label} ${n === 1 ? "1 file" : `${n} files`} in ${root}/`);
    }
    groups.clear();
}
function actionLabel(a) {
    switch (a.kind) {
        case "write": return a.reason === "create" ? "+ create " : a.reason === "update" ? "~ update " : "! replace";
        case "delete": return "- delete ";
        case "unlink": return "- unlink ";
        case "rmtree": return "- remove ";
        case "symlink": return "+ link   ";
        case "conflict": return "✗ conflict";
        case "manual": return "? manual ";
        case "skip": return "· skip   ";
        case "info": return "i info   ";
    }
}
function renderAction(a) {
    const label = actionLabel(a);
    switch (a.kind) {
        case "write": return `  ${label} ${a.path}${a.note ? `  (${a.note})` : ""}`;
        case "delete": return `  ${label} ${a.path}  (${a.reason === "stale" ? "no longer in skill" : "local changes discarded (--force)"})`;
        case "unlink":
        case "rmtree": return `  ${label} ${a.path}  (${a.note})`;
        case "symlink": return `  ${label} ${a.path} -> ${a.target}`;
        case "conflict": return `  ${label} ${a.path} [${a.code}]\n      ${a.detail}\n      FIX: ${a.fix}`;
        case "manual": return `  ${label} ${a.subject}: ${a.detail}\n      FIX: ${a.fix}`;
        case "skip":
        case "info": return `  ${label} ${a.subject}: ${a.detail}`;
    }
}
export function renderSummaryLine(plan) {
    const s = planSummary(plan);
    return `Plan: ${s.create} to create, ${s.update} to update, ${s.delete} to delete, ${s.conflict} conflict(s), ${s.manual} manual step(s).`;
}
