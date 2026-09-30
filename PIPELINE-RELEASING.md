<!-- Pipeline release guide written by OpenAI Codex. -->
# Publishing the pipeline POC

This guide packages the existing Go-based compiler as `@pengeszikra/typescript`
with the separate `tspipe` command. Only the dedicated `pipeline:*` scripts below
belong to this release flow. The upstream `typescript:release` tasks target
Microsoft's distribution and must not be used to publish this fork.

No new npm dependency is needed. The root stays `private: true`. The packaging
scripts do not modify `Herebyfile.mjs`, the upstream workspace manifests or the
upstream JS API launcher; a small independent CLI launches our own binaries.
This first package deliberately ships the compiler CLI, not the unstable JS API.

## 1. Apply and commit the ZIP

Copy the files from the ZIP's `files/` directory into the repository root, keeping
their relative paths. `package.json` is based on the GitHub `pipeline-operator`
version at preparation time, including its existing `test` devDependency. If
you have subsequently edited it, merge the four additions (`_comment` and the
three npm scripts) rather than replacing your new edits. No dependency or
lockfile change is required by this packaging work.

In interactive zsh, run `setopt interactivecomments` once before pasting blocks
with `#` comments, or omit those comment lines.

```sh
# Commands prepared by OpenAI Codex.
git diff --stat
git add README.md PIPELINE-RELEASING.md package.json tools/pipeline
git diff --cached
git commit -m "Add pipeline POC npm packaging and project documentation"
git push sajat pipeline-operator
```

## 2. Choose the npm identity

Edit `tools/pipeline/release.json` before building:

- `scope`: `@pengeszikra` by default. Use `@pipeline` only after obtaining
  permission to publish in that user/organization scope. Package-name absence
  does not establish scope ownership. If you change the scope, also update the
  public installation examples in the README.
- `version`: `7.1.0-pipeline.1`. Increment the final number for each release;
  published name/version pairs cannot be overwritten. The base version must
  match `tsc/internal/core/version.go`.
- `tag`: `next`; this release script deliberately avoids a stable `latest` tag.
- `repository`: the fork's GitHub URL.

Commit configuration changes before making the release build. The builder records
the commit and whether the checkout was dirty; actual publication requires a
clean checkout and a build from its current commit.

## 3. Build and test locally

You need Git, Go 1.27+ and Node.js 22.18+. Use the repository's supported npm.
Build only your host platform first:

```sh
# Commands prepared by OpenAI Codex.
npm run pipeline:pack
npm run test:pipeline-package
```

Output is under `built/pipeline-npm/`:

- `packages/`: generated npm package directories.
- `tarballs/`: the actual `.tgz` files to install or publish.
- `release-manifest.json`: package order, exact versions and SHA-512 checksums.
- `package-test.json`: evidence that these exact archives passed on this host.

Each build replaces this dedicated output directory. It never uploads anything.
The test creates a temporary consumer project and installs both the host binary
archive and main archive through npm, offline and without install scripts. It
checks TS, TSX, JSX children, type-changing chains, generics, expected type/arity
errors, standard libraries and a missing-platform error. No credentials needed.

To install the archives into your own throwaway project, select the binary
archive matching your machine. For an Apple Silicon Mac and version 7.1.0-pipeline.1:

```sh
# Commands prepared by OpenAI Codex. Run inside your test project.
npm install --save-dev --offline --ignore-scripts --omit=optional --no-audit --no-fund /absolute/path/TypeScript/built/pipeline-npm/tarballs/pengeszikra-typescript-darwin-arm64-7.1.0-pipeline.1.tgz /absolute/path/TypeScript/built/pipeline-npm/tarballs/pengeszikra-typescript-7.1.0-pipeline.1.tgz
npx tspipe --version
npx tspipe --project tsconfig.json
```

Both archives are explicit dependencies in this local-only test; `--omit=optional`
avoids fetching unpublished archives for other systems. For normal installation
from npm after publication, **keep optional dependencies enabled**.

## 4. Build the full release

```sh
# Commands prepared by OpenAI Codex.
npm run pipeline:pack -- --all
npm run test:pipeline-package
```

This sequentially cross-compiles six platform packages plus the main package:

| npm suffix | Go target |
| --- | --- |
| `typescript-darwin-arm64` | `darwin/arm64` |
| `typescript-darwin-x64` | `darwin/amd64` |
| `typescript-linux-x64` | `linux/amd64` |
| `typescript-linux-arm64` | `linux/arm64` |
| `typescript-win32-x64` | `windows/amd64` |
| `typescript-win32-arm64` | `windows/arm64` |

All package names have your configured scope. The binaries and `.d.ts` libraries
are bundled in each platform archive; the main package has exact-version
`optionalDependencies`. There is no postinstall download and consumers need no Go.
`CGO_ENABLED=0` follows the upstream default CLI build. Cross-platform runtime
validation still needs real Windows/macOS/Linux machines; local tests validate
only the executing host. Packages do not add native signing/notarization.

## 5. Inspect and dry-run

```sh
# Commands prepared by OpenAI Codex.
npm run pipeline:publish
```

Without `--publish`, this invokes `npm publish --dry-run` for each archive. It
validates names, versions and checksums and prints package contents and metadata.
It does not create an npm release, reserve the name, or prove publishing rights.

## 6. Publish explicitly

Sign in with the account owning the selected scope and enable npm's required
publishing authentication (interactive 2FA is the simplest manual path).

```sh
# Commands prepared by OpenAI Codex.
npm login
npm whoami
npm run pipeline:publish -- --publish
```

The script checks the full platform matrix, clean/current source commit and
matching installed-package test result. It publishes each platform package
first, then the main package, using `--access public --tag next` and the official
npm registry. Respond to npm's authentication prompts. For an OTP retry, npm's
`npm_config_otp` environment variable can be supplied for that invocation; never
commit tokens, passwords or OTPs to the repository.

Publication across several npm packages is not atomic. If a release stops after
publishing some packages, do not overwrite those versions: inspect the registry
and publish only the missing archives from the same verified build manually, or
increment the version, commit and rebuild the complete release.

## 7. Try the published release

In a separate project:

```sh
# Commands prepared by OpenAI Codex.
npm install --save-dev @pengeszikra/typescript@next
npx tspipe --version
npx tspipe --project tsconfig.json
```

The separate executable avoids competing with the official `tsc` command. A
successful CLI install does not replace bundler parsers or the editor's language
server. Compile pipeline source before other tools try to parse that syntax.

Official npm references:

- https://docs.npmjs.com/cli/v11/using-npm/scope/
- https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
- https://docs.npmjs.com/cli/v11/commands/npm-publish/
