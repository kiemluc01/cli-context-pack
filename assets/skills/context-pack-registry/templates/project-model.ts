/**
 * ProjectModel — deterministic output of the Detector.
 *
 * Rules:
 *  - Built only from repository files (manifests, lockfiles, config). No AI required.
 *  - Every array is sorted (by `name`, then other fields) so identical repos
 *    produce byte-identical JSON.
 *  - Evidence lists the file(s) that justified each detection, for explainability.
 *  - Extend only when a requirement needs a new field.
 */

export type Evidence = readonly string[]; // repo-relative paths, '/' separators

export interface Detected {
  readonly name: string;      // normalized lowercase id, e.g. "typescript", "nestjs"
  readonly version?: string;  // from manifest/lockfile when available
  readonly evidence: Evidence;
}

export interface Dependency extends Detected {
  readonly scope: "runtime" | "dev" | "peer" | "optional" | "test";
  readonly ecosystem: "npm" | "maven" | "gradle" | "pypi" | "go" | "cargo" | "other";
}

export interface ModuleInfo {
  readonly name: string;
  readonly path: string;      // repo-relative
  readonly languages: readonly string[];
}

export interface ProjectModel {
  readonly schemaVersion: 1;
  readonly languages: readonly Detected[];        // typescript, python, java, go, ...
  readonly frameworks: readonly Detected[];       // nestjs, nextjs, spring, fastapi, ...
  readonly dependencies: readonly Dependency[];
  readonly packageManagers: readonly Detected[];  // npm, pnpm, yarn, maven, gradle, poetry, uv, go, cargo
  readonly testing: readonly Detected[];          // vitest, jest, pytest, junit, go-test, ...
  readonly infrastructure: readonly Detected[];   // docker, docker-compose, helm, ...
  readonly repositoryStructure: {
    readonly kind: "single" | "monorepo";
    readonly workspaceTool?: string;              // pnpm-workspaces, nx, turborepo, lerna, ...
    readonly roots: readonly string[];            // package roots, repo-relative
  };
  readonly modules: readonly ModuleInfo[];
  readonly agents: readonly Detected[];           // claude, copilot, codex (from config files present)
}

/** Manifest → detection hints (non-exhaustive; Detector owns the real table). */
export const DETECTION_SIGNALS: Readonly<Record<string, readonly string[]>> = {
  "pom.xml": ["java", "maven"],
  "build.gradle": ["java", "gradle"],
  "build.gradle.kts": ["kotlin", "gradle"],
  "package.json": ["javascript", "npm"],
  "tsconfig.json": ["typescript"],
  "nest-cli.json": ["nestjs"],
  "next.config.*": ["nextjs"],
  "pyproject.toml": ["python"],
  "go.mod": ["go"],
  "Cargo.toml": ["rust", "cargo"],
  "Dockerfile": ["docker"],
  "docker-compose.*": ["docker-compose"],
  "Chart.yaml": ["helm"],
};
