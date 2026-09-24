# Pipeline operator development

## Starting point

- Upstream: https://github.com/microsoft/TypeScript.git
- Base commit: `df1a31e6d5c4aa4485f276fdfb4218a7bfcdf348` (2026-09-24).
- Local branch: `pipeline-operator`.
- Checkout: shallow clone; upstream history can be fetched later.
- Remote `upstream` points to Microsoft. No personal GitHub remote is configured.
- Proposal: https://dev.to/pengeszikra/pipeline-operator-great-again-1cbn

## Goal

Implement the article's minimal function pipeline in the native Go compiler:

```ts
const result = input |> validate |> prepare |> filter(predicate);
```

The right operand evaluates to a callable that receives the left value as its
single supplied argument. Support curried function factories and preserve
TypeScript inference and useful diagnostics. No topic placeholder is proposed.

## First milestone

1. Build and smoke-test the unchanged upstream compiler.
2. Specify precedence, left-to-right evaluation, method receiver semantics,
   arrow-function parentheses, and async boundaries before implementation.
3. Implement syntax, checking, and JavaScript emission.
4. Test chains, currying, generics, overloads, contextual typing, diagnostics,
   evaluation order, and single evaluation of side-effecting operands.

Compiler code is still unchanged. No pipeline feature is implemented yet.

## Source map

| Area | Starting location |
| --- | --- |
| AST schema and generation | `tools/scripts/tsc/ast.json`, `tools/scripts/tsc/generate-go-ast.ts` |
| Token recognition | `tsc/internal/scanner/scanner.go` |
| Expression parsing | `tsc/internal/parser/parser.go`: `parseBinaryExpressionOrHigher`, `parseBinaryExpressionRest` |
| Precedence | `tsc/internal/ast/precedence.go` |
| Type checking | `tsc/internal/checker/checker.go`: `checkBinaryLikeExpression`, `checkCallExpression`, `resolveCall` |
| Emission | `tsc/internal/transformers/`, `tsc/internal/printer/` |
| Compiler tests | `tsc/testdata/tests/cases/compiler/` |
| Expected results | `tsc/testdata/baselines/reference/` |

Generated AST files must be updated through their generators rather than edited
as the authoritative source.

## Environment and validation

- Git 2.51.1 and Node 24.19.0 available. Node satisfies the package's engines
  requirement; the upstream Volta pin is 24.20.0.
- Go 1.27.1 installed from the official `dl.google.com` distribution into
  `/workspace/scratch/278229582c5f/toolchains/go`.
- Dependency setup completed with the declared npm 11.19.1:
  `npm exec --yes --package=npm@11.19.1 -- npm ci --no-audit --no-fund`.
- `npm run build` passed with Go on PATH (initial build: about 2m 24s).
- `./built/local/tsc --version` reports `Version 7.1.0-dev`.
- Existing scanner and parser package tests passed.
- A strict-mode TypeScript smoke program compiled to JavaScript, then executed
  with Node and printed `Result: 42`.
- The full compiler and language-service suites have not been run.

For this workspace, expose the locally installed toolchain before building:

```sh
export PATH=/workspace/scratch/278229582c5f/toolchains/go/bin:$PATH
npm run build
./built/local/tsc --version
go -C ./tsc test ./internal/scanner ./internal/parser
go -C ./tsc test -run='TestLocal/<test name>' ./internal/testrunner
```

Follow `CONTRIBUTING.md` for broader validation and upstream submission gates.

## Later GitHub publication

After a personal destination repository exists, add it as `origin` and push the
`pipeline-operator` branch. Keep `upstream` for Microsoft updates. This setup has
not created a GitHub repository, pushed commits, or opened a pull request.

This checkout lives in the conversation's execution workspace, not on the user's
computer. Export or publish changes before relying on long-term availability.
