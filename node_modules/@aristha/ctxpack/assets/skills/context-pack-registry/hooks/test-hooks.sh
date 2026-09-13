#!/bin/sh
# Scenario tests for the Context Pack Registry hooks. Each case runs in a fresh temp repo.
# shellcheck disable=SC2015,SC2016,SC2034  # test DSL: a&&b||c reporting, literal ${PASS} fixtures
# Usage: sh .agent/skills/context-pack-registry/hooks/test-hooks.sh   (formatter cases need ruff)
HOOKS=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
SKILL=$(CDPATH='' cd -- "$HOOKS/../../.." && pwd)
pass=0; failc=0
new_repo() {
  R=$(mktemp -d); cd "$R" || exit 1
  git init -q; git config user.email t@t; git config user.name t
  cp -r "$SKILL" .agent
  git config core.hooksPath .agent/skills/context-pack-registry/hooks
  git add .agent && git commit -q --no-verify -m init
}
expect() { # expect <name> <want: block|pass> <grep-pattern-in-output or ->
  name=$1 want=$2 pat=$3
  out=$(git commit -q -m t 2>&1); rc=$?
  got=pass; [ $rc -ne 0 ] && got=block
  ok=1; [ "$got" = "$want" ] || ok=0
  if [ "$pat" != "-" ]; then printf '%s' "$out" | grep -qE -- "$pat" || ok=0; fi
  if [ $ok -eq 1 ]; then pass=$((pass+1)); echo "ok   - $name"; else failc=$((failc+1)); echo "FAIL - $name (rc=$rc)"; echo "$out" | sed 's/^/     | /'; fi
}

new_repo; mkdir -p src/user; echo 'export const f = (a: number) => a + 1;' > src/user/user.service.ts; git add .
expect "TS source without test blocks" block "tests/user/user.service.spec.ts|src/user/user.service.spec.ts"

new_repo; mkdir -p src/user tests/user; echo 'export const f = (a: number) => a + 1;' > src/user/user.service.ts
echo 'test("x",()=>{})' > tests/user/user.service.spec.ts; git add .
expect "TS source with mirrored test passes" pass "PASS"

new_repo; mkdir -p src/user; echo 'export const f = 1;' > src/user/user.service.ts; echo 'x' > src/user/user.service.test.ts; git add .
expect "Colocated .test.ts passes" pass -

new_repo; echo "# hi" > README.md; git add .
expect "Docs-only change passes" pass "SKIP \(nothing to check\)"

new_repo; mkdir -p src; printf "export * from './a';\nexport { b } from './b';\nexport type { C } from './c';\n" > src/index.ts; git add .
expect "Barrel index.ts exempt" pass -

new_repo; mkdir -p src/a src/b tests/b; echo 'export const x = () => 1;' > src/a/index.ts; echo t > tests/b/index.spec.ts; git add .
expect "Generic stem needs nearby test (far test does not count)" block "src/a/index.ts"

new_repo; mkdir -p src/pkg tests; printf 'def f(x):\n    return x + 1\n' > src/pkg/calc.py; printf 'def test_f(): pass\n' > tests/test_calc.py; git add .
expect "Python flat tests/test_x.py passes" pass -

new_repo; mkdir -p src/pkg; printf 'from .a import b\nfrom .c import (\n    d,\n    e,\n)\n__all__ = [\n    "b",\n]\n' > src/pkg/__init__.py; git add .
expect "Python __init__ re-exports exempt" pass -

new_repo; mkdir -p pkg/x; printf 'package x\nfunc F() int { return 1 }\n' > pkg/x/f.go; git add .
expect "Go without same-dir _test.go blocks" block "pkg/x/f_test.go"

new_repo; mkdir -p gen; echo 'export const a=1' > gen/client.ts; echo 'gen/*' > .agent/test-exemptions; git add .
expect "Repo exemption file honored" pass -

new_repo; mkdir -p src; echo 'const k = "AKIAABCDEFGHIJKLMNOP";' > src/k.ts; echo t > src/k.spec.ts; git add .  # context-pack-registry:allow-secret (fixture)
expect "AWS key blocks and is redacted" block "AKIA\*{12}"
printf '%s' "$out" | grep -q "AKIAABCDEFGHIJKLMNOP" && { echo "FAIL - full secret printed"; failc=$((failc+1)); } || { echo "ok   - full secret never printed"; pass=$((pass+1)); }  # context-pack-registry:allow-secret (fixture)

new_repo; echo 'API_KEY=supersecretvalue123' > .env; git add -f .env
expect ".env file blocks" block "Secret-bearing file type"

new_repo; echo 'X=' > .env.example; git add .
expect ".env.example allowed" pass -

new_repo; mkdir -p src; echo 'const k = "AKIAABCDEFGHIJKLMNOP"; // context-pack-registry:allow-secret fixture' > src/k.ts; echo t > src/k.spec.ts; git add .
expect "Inline allow marker honored" pass -

new_repo; mkdir -p src; echo 'const k = "AKIAABCDEFGHIJKLMNOP"; // agent-registry:allow-secret legacy marker' > src/k.ts; echo t > src/k.spec.ts; git add .  # context-pack-registry:allow-secret (fixture)
expect "Legacy allow marker still honored" pass -

new_repo; mkdir -p src; printf 'const password = "hunter2hunter2";\n' > src/db.ts; echo t > src/db.spec.ts; git add .  # context-pack-registry:allow-secret (fixture)
expect "Hard-coded password blocks" block "Hard-coded secret assignment"

new_repo; mkdir -p src; printf 'const password = process.env.DB_PASSWORD;\nconst url = "postgres://user:${PASS}@db/x";\n' > src/db.ts; echo t > src/db.spec.ts; git add .
expect "Env-var references not flagged" pass -

new_repo; mkdir -p src; printf 'const url = "postgres://admin:s3cr3tpw@db.internal:5432/app";\n' > src/db.ts; echo t > src/db.spec.ts; git add .  # context-pack-registry:allow-secret (fixture)
expect "Credential in URL blocks" block "Credential in connection URL"

new_repo; mkdir -p src; printf 'const task = "task-abcdefghijklmnopqrstuvwxyz0123";\n' > src/t.ts; echo t > src/t.spec.ts; git add .
expect "sk- inside a word not flagged" pass -

new_repo; mkdir -p src; printf 'let i = 0;\n++i;\n' > src/c.ts; echo t > src/c.spec.ts; git add .
expect "Added line starting with ++ handled" pass -

new_repo; printf -- '-----BEGIN RSA PRIVATE KEY-----\nMIIE\n' > deploy.txt; git add .  # context-pack-registry:allow-secret (fixture)
expect "Private key content blocks" block "Private key"

new_repo; mkdir -p "src/my dir"; echo 'export const f=1' > "src/my dir/sp ace.ts"; git add .
expect "Path with spaces handled (blocks, no crash)" block "src/my dir/sp ace.ts"

# Formatter cases (need ruff on PATH)
if ! command -v ruff >/dev/null 2>&1; then echo "skip - formatter cases (ruff not installed)"; else
new_repo; mkdir -p tests; printf 'def f( x ):\n  return x+1\n' > calc.py; echo 'def test_f(): pass' > tests/test_calc.py; git add .
expect "Formatter fixes and re-stages Python" pass "reformatted and re-staged"
git show HEAD:calc.py | grep -q 'def f(x):' && { echo "ok   - committed content is formatted"; pass=$((pass+1)); } || { echo "FAIL - committed content not formatted"; failc=$((failc+1)); }

new_repo; mkdir -p tests; printf 'def f( x ):\n  return x+1\n' > calc.py; echo 'def test_f(): pass' > tests/test_calc.py; git add .
out=$(AGENT_FORMAT_MODE=check git commit -q -m t 2>&1); rc=$?
if [ $rc -ne 0 ] && printf '%s' "$out" | grep -q "not formatted" && grep -q 'def f( x ):' calc.py; then echo "ok   - check mode blocks and leaves file untouched"; pass=$((pass+1)); else echo "FAIL - check mode"; echo "$out"; failc=$((failc+1)); fi

new_repo; mkdir -p tests; printf 'def f( x ):\n  return x+1\n' > calc.py; echo 'def test_f(): pass' > tests/test_calc.py; git add .; echo '# unstaged' >> calc.py
expect "Partially staged file not auto-formatted (warned)" pass "partially staged"
git show HEAD:calc.py | grep -q 'unstaged' && { echo "FAIL - unstaged hunk leaked into commit"; failc=$((failc+1)); } || { echo "ok   - unstaged hunk not committed"; pass=$((pass+1)); }

new_repo; mkdir -p tests; printf 'def f( x ):\n  return x+1\n' > calc.py; echo 'def test_f(): pass' > tests/test_calc.py; git add .
out=$(AGENT_HOOKS_SKIP=format git commit -q -m t 2>&1); printf '%s' "$out" | grep -q "SKIP (AGENT_HOOKS_SKIP)" && { echo "ok   - explicit skip reported"; pass=$((pass+1)); } || { echo "FAIL - skip"; echo "$out"; failc=$((failc+1)); }

fi
new_repo; mkdir -p src; echo 'export const f=1' > src/a.ts; git add .
out=$(AGENT_HOOKS_SKIP=tests,secrets git commit -q -m t 2>&1); rc=$?
[ $rc -ne 0 ] && { echo "ok   - test check cannot be skipped via env"; pass=$((pass+1)); } || { echo "FAIL - test check skippable"; failc=$((failc+1)); }

echo ""; echo "passed: $pass  failed: $failc"
[ $failc -eq 0 ]
