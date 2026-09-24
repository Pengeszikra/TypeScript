<!-- Pipeline tests and documentation authored by OpenAI Codex. -->
# Pipeline operator acceptance tests

These tests specify the minimal `value |> function` operator. They use the native compiler's existing `harnessutil.CompileFiles`
infrastructure. They exercise the native pipeline implementation.

## Run

Use the Go and Node versions required by the repository and run `npm ci` first.
The pinned stock TypeScript npm dependency is used only as an independent syntax
validator for emitted JSX in `preserve` mode. It never transforms pipeline input.

From the repository root:

```sh
# Example coded by OpenAI Codex.
npm run test:pipeline:controls
npm run test:pipeline
```

In the current conversation workspace, first expose the installed Go toolchain:

```sh
# Example coded by OpenAI Codex.
export PATH=/workspace/scratch/278229582c5f/toolchains/go/bin:$PATH
```

For one case, or machine-readable results:

```sh
# Example coded by OpenAI Codex.
go -C ./tsc test -run '^TestPipeline$/evaluation-order' ./internal/testrunner -count=1 -v
go -C ./tsc test -run '^TestPipeline$' ./internal/testrunner -count=1 -json
```

Node is required for runtime and preserved-JSX assertions. Missing tools fail
the test rather than silently skipping coverage. Go compiles the compiler under
test directly from source; these tests do not use a potentially stale `built/`
binary or require a separate compiler build.

## Current state

- `TestPipelineControls`: **156 passing variants** of ordinary TypeScript calls.
- `TestPipeline`: **156 passing variants** of pipeline expressions.
- No failing parser output has been recorded as an accepted baseline.
- Normal Go test discovery includes both suites. Neither suite is skipped or
  converted into an expected-failure success. The original test-first commit
  recorded all 136 initial pipeline variants as failing before implementation.

There are 33 fixture pairs: 27 shared language cases, each compiled as both `.ts`
and `.tsx`, and 6 JSX-specific cases. Every variant is tested with ES2015 and
ES2022 output. JSX-specific cases cover `preserve`, `react`, `react-jsx`, and
`react-jsxdev`. Shared cases use `react` for the TSX parser mode.

## Coverage

| Area | Fixtures |
| --- | --- |
| Basic application and inferred intermediate/final types | `basic-chain` |
| 32-stage left-associative chain | `long-chain` |
| Curried array operations | `currying` |
| Generic identity, readonly tuple preservation, overload choice | `generic-overloads` |
| Unannotated/destructured arrow stage parameters | `contextual-arrows` |
| Arithmetic precedence, parentheses, conditional branches, comments | `precedence-and-comments` |
| Input/factory/call ordering and single evaluation | `evaluation-order` |
| Exceptions prevent evaluation of later stage factories | `exceptions-stop-chain` |
| Short-circuiting, untaken branches, repeated callback execution | `branch-local-evaluation` |
| Arrow stages retain lexical `this` | `lexical-scope` |
| Recursive field initialization and isolated temporaries | `recursive-fields` |
| Default/destructured parameter scope and function length | `parameter-scope` |
| Property and element method receivers | `method-receiver` |
| Suspended generators keep their own pipeline input | `suspended-stage` |
| Input-side flow narrowing, arrow assignments, generator binding defaults | `flow-and-binding` |
| Optional/rest parameters and exactly one supplied argument | `optional-and-rest` |
| Promise result types and explicit awaiting | `explicit-await` |
| Strings, regexes, bitwise OR, union types | `literals-and-bitwise` |
| Wrong input, non-callable stage, required second argument | `wrong-input`, `non-callable`, `required-second-argument` |
| Middle-stage mismatch, overload rejection, nullable callable | `middle-stage-mismatch`, `overload-mismatch`, `possibly-undefined` |
| Missing await, generic constraint, incompatible final assignment | `promise-needs-await`, `generic-constraint`, `wrong-result-type` |
| JSX children, attributes and spread expressions | `jsx-containers` |
| JSX-valued input, arrow-produced elements and fragments | `jsx-arrows-and-fragments` |
| TSX generic arrow disambiguation | `tsx-generic-arrow` |
| JSX text/entity/string boundaries and nested expressions | `jsx-text-boundaries` |
| JSX prop mismatch and invalid stage inside a JSX child | `jsx-prop-mismatch`, `jsx-stage-mismatch` |

## What the assertions mean

`cases.json` defines the variants and expected results. Each directory contains
an `input` fixture using pipeline syntax and an independently authored `control`
fixture using ordinary TypeScript. Shared `.ts` fixture text is also submitted
to the compiler with a `.tsx` filename, so it really exercises both parser modes.

The shared prelude contains exact type-equality assertions. These prevent a
successful compile caused by inference degrading to `any`. Selected exported
types are also checked in emitted `.d.ts` files. Arrow controls may spell out
parameter types; unannotated pipeline arrow inference remains an explicit new
requirement, not something assumed to work automatically for ordinary IIFEs.

Negative fixtures require exactly the specified diagnostic code, a nonempty
range inside the marked expression in the original source file, and no emitted
output under `noEmitOnError`. A generic syntax failure cannot satisfy them.
The marked range deliberately allows the checker to underline either the input
or the affected call/stage rather than prescribing a synthetic AST layout.

Positive fixtures require JavaScript/JSX, declaration and source-map output.
Maps must embed the exact original source and contain mappings to its filename;
precise per-token debugger mapping is not yet tested. Emitted JavaScript is run
in Node and its exported result is compared with an independent JSON expectation.
This includes full side-effect traces and promise completion.

In `jsx: preserve`, JSX is intentionally not executed in Node. Instead, emitted
`.jsx` is parsed by the stock TS 6 JSX parser, which rejects unlowered pipeline
syntax. The other three JSX modes execute using a small local JSX runtime stub.
No React download, DOM or browser is needed; these tests validate compiler JSX
integration, not React reconciliation or rendering behavior.

## Semantics established by these tests

- Chains associate to the left and evaluate input, stage factory and stage call
  in source order, once each. Untaken branches and later stages after a throw
  must remain unevaluated.
- Each stage receives one argument. Ordinary optional/rest parameter rules apply.
- Arithmetic binds more tightly than pipeline. Parser round-trip tests also cover
  logical and conditional boundaries; precedence is specified in `PIPELINE-DEVELOPMENT.md`.
- Method stages retain their property/element receiver, just like an ordinary method call.
- Parenthesized arrows receive contextual parameter types from the pipeline input.
- Promises are ordinary values until explicitly awaited; there is no implicit await.

Bare `|> await`, unparenthesized arrow stages, editor hover/completion behavior,
and `.js`/`.jsx` input support are not specified by this suite. They remain separate
design or integration work. The compiler is expected to keep its existing wider
regression suite passing once the feature is implemented.

The strict JSON case manifest was coded by OpenAI Codex; attribution is kept
here because comments are not valid JSON.
