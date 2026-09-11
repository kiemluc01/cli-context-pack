import { CtxpackError } from "./errors.js";
import { readTextOrNull, toAbs } from "./fsutil.js";

export const MCP_CONFIG_PATH = ".mcp.json";
export const MCP_SERVER_NAME = "agent-registry";
export const MCP_SERVER_CONFIG = {
    type: "http",
    url: "http://localhost:8000/mcp",
};

function invalidConfig(message) {
    return new CtxpackError("INVALID_CONFIGURATION", `${MCP_CONFIG_PATH}: ${message}`, "The MCP configuration must be valid JSON with an mcpServers object.", `Fix ${MCP_CONFIG_PATH} manually, or remove it and run "ctxpack apply --force".`, 2);
}

export function desiredMcpConfig(root, force) {
    const existingText = readTextOrNull(toAbs(root, MCP_CONFIG_PATH));
    if (existingText === null)
        return { text: JSON.stringify({ mcpServers: { [MCP_SERVER_NAME]: MCP_SERVER_CONFIG } }, null, 2) + "\n", existingText };

    let existing;
    try {
        existing = JSON.parse(existingText);
    }
    catch {
        throw invalidConfig("contains invalid JSON");
    }
    if (!existing || typeof existing !== "object" || Array.isArray(existing))
        throw invalidConfig("must contain a JSON object");
    if (existing.mcpServers !== undefined && (!existing.mcpServers || typeof existing.mcpServers !== "object" || Array.isArray(existing.mcpServers)))
        throw invalidConfig("mcpServers must be an object");

    const current = existing.mcpServers?.[MCP_SERVER_NAME];
    const expected = JSON.stringify(MCP_SERVER_CONFIG);
    if (current !== undefined && JSON.stringify(current) !== expected && !force)
        return { conflict: true, existingText };

    const next = { ...existing, mcpServers: { ...(existing.mcpServers ?? {}), [MCP_SERVER_NAME]: MCP_SERVER_CONFIG } };
    return { text: JSON.stringify(next, null, 2) + "\n", existingText };
}