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

Compiler code is still unchanged. No pipeline feature is implemented yet.

## Test-first acceptance suite

The native compiler harness now has `TestPipeline` and `TestPipelineControls`,
with fixtures and coverage documented in `tsc/testdata/pipeline/README.md`.
There are 28 fixture pairs, expanded to 136 variants per suite across TS/TSX,
ES2015/ES2022, and the applicable JSX modes. Ordinary-call controls pass; pipeline
cases are deliberately red until implementation. No parser failures are accepted
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
