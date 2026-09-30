<!-- Pipeline POC documentation written by OpenAI Codex. -->
# TypeScript Pipeline — an experimental, data-first compiler

**A proof of concept for exploring a type-safe, single-input pipeline operator in
both TypeScript and TSX.** This is an independent fork of the Go-based TypeScript
compiler. It is not an official Microsoft release or a production-ready language
extension, and it does not claim compatibility with the current TC39 proposal.

Project by **Péter Vívó / Pengeszikra**. The motivation started with
[Pipeline operator great again](https://dev.to/pengeszikra/pipeline-operator-great-again-1cbn)
and practical experience using a pipeline proposal in a React JS/JSX project.

## Start with the data

Usually we already have a value and want to do something with it. The pipeline
operator lets the source follow that order: **data first, transformation next**.

```ts
// Example coded by OpenAI Codex.
const normalize = (text: string): string => text.trim().toLowerCase();
const input = "  Hello, pipeline!  ";
const result = input |> normalize;
// Ordinary function application: normalize(input)
```

A longer workflow reads from left to right instead of nesting calls:

```ts
// Example coded by OpenAI Codex.
const trim = (text: string): string => text.trim();
const count = (text: string): number => text.length;
const double = (value: number): number => value * 2;
const describe = (value: number): string => `Result: ${value}`;

const result: string = "  pipe  " |> trim |> count |> double |> describe;
// Result: 8
// Equivalent value for these pure functions: describe(double(count(trim("  pipe  "))))
```

Every stage receives **exactly one argument**: the previous stage's return value.
Intermediate types may change. TypeScript checks that each output is assignable
to the next function's input type and infers the final result. The functions can
come from different modules; they do not need to belong to one class or library.

```ts
// Intentional type-error example coded by OpenAI Codex.
const count = (text: string): number => text.length;
const uppercase = (text: string): string => text.toUpperCase();
const invalid = "hello" |> count |> uppercase;
// Type error: count returns number, but uppercase requires string.
```

This encourages a unary, functional API. Data remains independent of the
functions that transform it: no wrapper object, attached methods, shared class
hierarchy, or fluent-interface implementation is needed. This is a composition
option alongside object-oriented code, not a prohibition on objects or methods.

## The same expression in TSX

Pipeline expressions work inside JSX children and attributes:

```tsx
// TSX usage example coded by OpenAI Codex.
// InteractiveElement is an ordinary JSX component; InputHandler is a typed,
// single-input transformation returning content that can be rendered.
const content = <InteractiveElement>{input |> InputHandler}</InteractiveElement>;
```

The expression says what happens to `input` in reading order, without nesting
`InputHandler(input)` inside further function calls. The same type checks apply
in `.ts` and `.tsx`. Treat `InputHandler` as an ordinary function; this syntax
does not turn direct function calls into React component rendering or change
React's rules for Hooks.

## What “single-input” means in this POC

- `value |> fn` supplies exactly one value to `fn`; there is no argument spreading
  or topic placeholder.
- A stage needing two required arguments is rejected. Use a unary adapter or a
  curried factory to configure additional inputs.
- **The current checker uses ordinary TypeScript call rules.** It does not require
  exactly one syntactically declared parameter: optional/rest parameters and
  zero-parameter callables follow the normal one-argument call compatibility rules.
- Type compatibility means **assignability**, not identical type names. Generics,
  overloads and TypeScript's usual `any` escape hatch keep their normal meaning.
- Input and stages are evaluated in order, once each. A stage that throws stops
  the chain. Emission may use temporary variables to preserve evaluation order.
- Arrow stages must be parenthesized: `value |> (x => x + 1)`.
- Promises are ordinary values; there is no implicit `await`.

These boundaries describe the implemented experiment accurately. Enforcing an
exact one-parameter declaration would be a separate language-design change.

## Try the compiler

The intended npm package is **`@pengeszikra/typescript`**, exposing **`tspipe`**.
The package is a **compiler CLI**, not a drop-in replacement for the official
`typescript` JavaScript compiler API or an editor extension.

After the maintainer has published the first `next` release:

```sh
# Commands prepared by OpenAI Codex.
npm install --save-dev @pengeszikra/typescript@next
npx tspipe --project tsconfig.json
```

Or run without adding a project dependency:

```sh
# Command prepared by OpenAI Codex.
npm exec --package=@pengeszikra/typescript@next -- tspipe --project tsconfig.json
```

The first release may not yet be published. Until then, build from source or
install the local npm archives as described in
[PIPELINE-RELEASING.md](https://github.com/Pengeszikra/TypeScript/blob/pipeline-operator/PIPELINE-RELEASING.md).

The npm distribution uses prebuilt native binaries and requires Node.js 22.18+,
but **does not require Go on the user's machine**. Release targets are macOS,
Linux and Windows, each on x64 and arm64. Cross-compilation does not replace
testing on each operating system; these are experimental, unsigned builds.

The dedicated `tspipe` command can coexist with the standard `tsc` command.
Build tools that parse TS/TSX themselves still need a separate integration:
compile pipeline input to JavaScript with `tspipe` before giving it to such a tool.
Installing this package alone does not teach Babel, esbuild, SWC, formatters or
an existing editor language server the new syntax.

## Build and test from source

Use Go 1.27+ and the Node/npm versions required by this repository.

```sh
# Commands prepared by OpenAI Codex.
npm ci
npm run build
./built/local/tsc --project /path/to/your/project/tsconfig.json
npm run test:pipeline
npm run test:pipeline:controls
```

To prepare and test an npm package for your own operating system:

```sh
# Commands prepared by OpenAI Codex.
npm run pipeline:pack
npm run test:pipeline-package
```

Building or testing does not publish anything. The publication guide explains
the full platform build, dry-run and explicit publish command. Windows users
can invoke `built/local/tsc.exe` for the direct compiler build.

## POC status and feedback

The acceptance suite covers TS/TSX, chains, inference, generics, overloads,
evaluation order, negative type cases and multiple JSX emit modes. Installed
package tests also compile TS and TSX fixtures using the actual packed binary.
See the [pipeline test specification](https://github.com/Pengeszikra/TypeScript/blob/pipeline-operator/tsc/testdata/pipeline/README.md).

Known limits include incomplete editor/language-service integration, unverified
`.js`/`.jsx` parity and precise per-token source-map behavior. Direct `eval` in
initializer scopes isolated by the pipeline transformation is not supported.
This is an experiment for evaluating syntax, type safety and developer
experience, not a claim of full ecosystem or production compatibility.

Please report minimal TS/TSX examples, expected behavior and the `tspipe --version`
output in [this fork's issues](https://github.com/Pengeszikra/TypeScript/issues).
Feedback on readability, unary APIs and type inference is especially useful.

## Credits and license

The compiler is derived from [Microsoft TypeScript](https://github.com/microsoft/TypeScript).
Original authorship, Apache-2.0 licensing and third-party notices remain in
`LICENSE.txt` and `NOTICE.txt` (distributed as `LICENSE` and `NOTICE.txt` in npm).
The project's motivation and direction are Péter Vívó's; the pipeline
implementation, packaging and examples in this work were coded by OpenAI Codex.
