<!-- Pipeline package documentation written by OpenAI Codex. -->
# Native binary for the TypeScript pipeline POC

This package contains one platform-specific build of the experimental TypeScript
compiler and its standard library declarations. The main scoped `typescript`
package selects it automatically and exposes the `tspipe` command.

Use matching versions of the main package and this package. Go is not required
on the user's computer. These are experimental, unsigned builds; building a
target is not the same as testing it on that operating system.

Project: https://github.com/Pengeszikra/TypeScript

The compiler is derived from Microsoft's TypeScript project. See `LICENSE` and
`NOTICE.txt` for the original license and third-party notices.
