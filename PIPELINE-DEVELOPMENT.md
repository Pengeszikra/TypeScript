<!-- Pipeline implementation and documentation authored by OpenAI Codex. -->
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
// Example coded by OpenAI Codex.
const result = input |> validate |> prepare |> filter(predicate);
```

The right operand evaluates to a callable that receives the left value as its
single supplied argument. Support curried function factories and preserve
TypeScript inference and useful diagnostics. No topic placeholder is proposed.

## Required TS and TSX parity

The operator must work equally in `.ts` and `.tsx` from the first implementation.
TSX support is a release criterion, not a later extension. This requirement comes
from the author's two years of using the earlier proposal in a React JS/JSX
project: readable function workflows and avoiding deeply nested call syntax are
central goals.

In either file type, a chain supplies exactly one argument to each stage. Whether
the target accepts that call is governed by TypeScript's call rules; this does
not by itself require the function declaration to contain exactly one parameter.

Required TSX expression contexts include:

```tsx
// Example coded by OpenAI Codex.
const title = value |> normalize |> format;
const content = <section>{value |> normalize |> renderValue}</section>;
const element = <Panel title={value |> normalize |> format} />;
const rendered = value |> normalize |> (x => <span>{x}</span>);
const wrapped = (<span>Example</span>) |> wrapElement;
const generic = value |> (<T,>(x: T) => x);
```

Names in these examples denote appropriately typed functions and components;
they are specification examples, not runnable fixtures yet. Keep normal TSX
disambiguation rules, such as the comma in a generic arrow's `<T,>`.

| Acceptance area | Required coverage |
| --- | --- |
| Shared expressions | Matching inference and diagnostics for equivalent `.ts` and `.tsx` chains |
| JSX containers | Pipelines in children, attributes, and spread expressions |
| JSX-valued stages | Parenthesized arrow stages returning elements or fragments; JSX values as pipeline inputs |
| JSX parsing boundaries | Literal `\|>` text and strings remain text; nested braces and JSX scanning resume correctly |
| JSX emit | `preserve`, `react`, `react-jsx`, and `react-jsxdev` retain their normal JSX behavior while pipeline syntax is lowered |
| Editor locations | Diagnostics and stage type information refer to the original pipeline source |

`.js`/`.jsx` parity can be assessed separately; it has not been added as an
explicit acceptance requirement by this clarification.

## Type checking and emission design constraints

- Resolve every stage as a call with one supplied argument using the existing
  call-signature, overload, inference, and contextual-typing machinery wherever
  possible. Do not approximate this with `Parameters<F>[0]` and `ReturnType<F>`.
- Check generic functions and generic curried factories explicitly. Context can
  affect inference; merely passing an already-finalized type from stage to stage
  may lose behavior available in ordinary nested calls.
- Preserve source identity and positions for diagnostics and editor features.
  Blindly checking detached synthetic call nodes is not an established solution:
  call checking also depends on parents, source files, flow information, and caches.
- Treat `p |> f` as function application, while separately defining runtime
  evaluation order and receiver semantics. For pure named stages a chain may
  emit as `h(g(f(p)))`; side-effecting operands can require temporaries.
- Under the proposed left-to-right evaluation rule, `getData() |> makeTransform()`
  must evaluate `getData()` before `makeTransform()`, each once. Directly emitting
  `makeTransform()(getData())` would reverse that order.
- Acceptance tests must cover successful chains, an incompatible middle stage,
  final result types, generic identity functions, overload selection, curried
  functions, and contextual arrow parameters in both TS and TSX contexts.

## First milestone

1. Build and smoke-test the unchanged upstream compiler.
2. Specify precedence, left-to-right evaluation, method receiver semantics,
   arrow-function parentheses, and async boundaries before implementation.
3. Implement syntax, checking, and JavaScript emission.
4. Test chains, currying, generics, overloads, contextual typing, diagnostics,
   evaluation order, and single evaluation of side-effecting operands in TS and
   TSX, including the JSX contexts and emit modes listed above.

The first working implementation is complete on the local branch. The scanner
recognizes `|>`, the parser represents each stage as a source-backed call with
`NodeFlagsPipeline`, and the existing call checker supplies inference and
signature diagnostics. Visitors and flow binding traverse the input before the
callee. A dedicated emit pass lowers pipelines before JSX and ECMAScript passes.
The JavaScript API scanner, factory and visitors recognize the same token/flag.

### Current operator semantics

- Left associative: `p |> f |> g` applies `f`, then `g`.
- Lower precedence than `||`, `??`, bitwise and arithmetic operators, higher
  than the conditional operator. Use parentheses to make mixed expressions clear.
- Arrow stages need parentheses: `p |> (value => value + 1)`.
- Exactly one argument is supplied; existing optional/rest/default parameter
  rules continue to apply.
- `p |> object.method` preserves the receiver, like `object.method(p)`.
- The input is evaluated before the stage expression, each once. A temporary
  retains the input across a side-effecting factory or explicit `await`/`yield`.
- No implicit awaiting and no topic placeholder.
- Parameter defaults and field initializers isolate their temporaries in lexical
  arrow closures, preserving parameter scope, function length, and recursive
  instance initialization. This is not an optimized emission strategy yet.

Initializer closures introduce an inner scope for direct `eval`; exact direct-eval
semantics in these contexts are not supported by this first prototype. Precise
debugger stepping, performance, decorators, and interactions with every compiler
option have not been exhaustively validated. Stock formatters/linters must also
learn the new syntax; format the compiler's own code with the repository tools.

The AST flag is internal to this fork; tools that assume every CallExpression
has ordinary call syntax need adaptation. Full language-service integration
(completion, signature help, edits/refactorings) remains a later milestone.

## Test-first acceptance suite

The native compiler harness now has `TestPipeline` and `TestPipelineControls`,
with fixtures and coverage documented in `tsc/testdata/pipeline/README.md`.
There are 33 fixture pairs, expanded to 156 variants per suite across TS/TSX,
ES2015/ES2022, and the applicable JSX modes. Both suites pass with this implementation. No parser failures are accepted
as baselines. Run `npm run test:pipeline:controls` and `npm run test:pipeline`
with Go on PATH.

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
- The full compiler and language-service Go suites pass as of 2026-09-25:
  `npm test` reports 163,916 tests, 2,218 skipped, and no failures (102.4 seconds).
- Implementation acceptance: 156 pipeline variants and 156 controls pass.
- Selected existing compiler regressions: 5,819 leaf checks pass, 23 are skipped
  by the upstream harness for unsupported options (ES5, System, alwaysStrict=false).
  Selection: `TestLocal/(jsx|call|generic|arrow|binary|optionalArgsWithDefaultValues)`.
- JavaScript API build and test build pass; scanner/visitor unit tests pass.
- Final native `npm run build` passes; the built `7.1.0-dev` binary compiles
  and runs `examples/pipeline/demo.ts` and `demo.tsx` with strict checking.
  TS prints `Result: 42`; TSX prints a span-shaped JSX object containing 42.
- Existing scanner/parser/AST/printer package tests and the new parser tests pass.
- AST and enum generation passes; a subsequent regeneration leaves all generated
  output hashes unchanged. The Go and JavaScript enum value checks agree.
- New parser tests cover malformed syntax, left association, child source order,
  and parse/print round trips in both TS and TSX.

For this workspace, expose the locally installed toolchain before building:

```sh
# Example coded by OpenAI Codex.
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

## Authorship annotations

Added or modified source files and implementation blocks identify OpenAI Codex.
Upstream authorship remains intact. Generated AST/enum files receive the same
notice reproducibly through `tools/scripts/tsc/pipeline-attribution.ts`.
`tools/scripts/tsc/ast.json` and `tsc/testdata/pipeline/cases.json` are strict JSON;
their pipeline changes were also coded by OpenAI Codex, documented here rather
than adding invalid comments to those files.

## Try the implementation

After `npm run build`, use the fork's `built/local/tsc` binary, rather than the
stock npm `tsc` command. The existing acceptance fixtures provide complete TS and
TSX examples; `examples/pipeline/demo.tsx` is a standalone runnable demonstration.

```sh
# Demo commands coded by OpenAI Codex.
./built/local/tsc --ignoreConfig --strict --target es2022 --module commonjs --jsx react --jsxFactory h --outDir /tmp/pipeline-demo examples/pipeline/demo.tsx
node /tmp/pipeline-demo/demo.js
```

## Repository test and lint fixes (2026-09-25)

Changes coded by OpenAI Codex:

- The acceptance harness uses the repository's `internal/json` wrapper, as
  required by `depguard`, and marks its independent subtests with `t.Parallel()`
  to match the parallel parent suites and the `tparallel` rule.
- The stock dprint parser does not recognize pipeline syntax. Only the two
  `examples/pipeline/demo.ts` and `demo.tsx` files are excluded from formatting;
  compiler source and all other normal formatting checks remain enabled.
- File-watcher integration tests probe their temporary filesystem before running
  backend assertions. A kernel may expose fanotify while the mounted filesystem
  cannot provide file handles. Only `ErrFilesystemUnsupported` causes a skip;
  unexpected setup failures still fail. The sequential goroutine-leak test uses
  the same error classification. Production watcher behavior is unchanged.

`npm test`, `npm run lint`, and `npm run check:format` are separate checks;
`npm test` does not implicitly run lint or formatting.

Validation after these fixes: `npm test` succeeds (163,916 tests, 2,218 skipped);
`npm run lint` reports zero issues in both Go modules; `npm run check:format`
succeeds. A separate focused run also passed all 312 pipeline/control variants
and confirmed that supported watcher backends execute while the unsupported
fanotify variant is skipped with an explicit reason.
